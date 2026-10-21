# Bareeq API

Node.js (Express) + PostgreSQL backend for the Bareeq site (`../Influencers-web`).
The site proxies `/api/*` and `/uploads/*` to this server (see the site's `next.config.ts`, `API_ORIGIN`, default `http://127.0.0.1:4000`).

## Run

```bash
cp .env.example .env      # then fill DATABASE_URL, JWT_SECRET, ADMIN_* (see below)
npm install
npm run db:setup          # creates tables, seeds categories / governorates / countries / admin
npm run dev               # http://localhost:4000 (restarts on file changes)
npm test                  # end-to-end checks against the running server (needs ADMIN_* in .env)
```

The database named in `DATABASE_URL` must exist (`CREATE DATABASE bareeq;`). Migrations live in `src/db/migrations/*.sql` and run once each, in order.

## Accounts

| role | How it is created | Status after sign-up | Can order |
|---|---|---|---|
| `user` | `POST /auth/register/user` — name + phone **or** e-mail + password | `approved` | yes, immediately |
| `client` (company) | `POST /auth/register/client` | `pending` until an admin approves | after approval |
| `influencer` (creator / model) | `POST /auth/register/influencer`, **or** a `user` upgrades with `POST /me/become-influencer` (same login) | `pending`; public only when `approved` | no |
| `admin` | seeded from `ADMIN_*` in `.env` | `approved` | — |

Statuses: `pending | approved | rejected | suspended` (suspended accounts cannot log in).
Request statuses: `pending | reviewing | confirmed | closed | rejected`.

## Responses

Every response is `{ "success": true, "data": …, "meta"?: { page, limit, total } }` or
`{ "success": false, "message": "<Arabic message shown to the visitor>" }` with a 4xx/5xx status.
Auth: `Authorization: Bearer <token>` (token from login / user sign-up, valid `JWT_EXPIRES_IN`).

## Endpoints (prefix `/api/v1`)

Public
- `GET /categories` — tree: parents with `children`
- `GET /governorates`, `GET /countries`
- `GET /platform-contact`
- `GET /influencers?page&limit&search&categoryId&locationScope&gender&governorateId&governorateIds&platform&available&sort` — approved creators
  - `categoryId` matches a specialty or a whole field; `governorateIds` and `platform` take comma lists; `available=1` = accepting work
  - `sort` = `newest` (default) | `oldest` | `name` | `popular` (most requests received)
  - `meta` = `{ page, limit, total, available }` (`available` = matches that accept work)
- `GET /influencers/facets` — `{ total, available, governorates[{ id, count }], platforms[{ platform, count }], categories[{ id, count }] }` over all public creators
- `GET /influencers/:id`

Auth
- `POST /auth/login` `{ phone, password }` — `phone` may also be an e-mail → `{ token, user }`
- `GET /auth/me` → `user`
- `POST /auth/register/user` `{ name, phone?, email?, password }` → `{ token, user }`
- `POST /auth/register/client` `{ name, phone, password, brandName, whatsapp?, contactEmail?, locationScope, governorateId?, countryId? }`
- `POST /auth/register/influencer` `{ name, phone, password, …creator profile }`

Signed in (`/me`)
- `GET /me/account`, `PATCH /me/account` — body depends on role (company fields / creator profile / name-phone-email-password)
- `POST /me/become-influencer` `{ …creator profile, name?, whatsapp?, contactEmail? }` — `user` only
- `GET /me/requests` — requests sent by this account
- Creators: `GET /me/profile`; `POST|DELETE /me/avatar`, `POST|DELETE /me/cover` (multipart `image`); `POST /me/portfolio` (multipart `images`, max 10 total); `DELETE /me/portfolio/:id`

Requests (signed-in `user`, or approved `client`)
- `POST /ugc-requests` `{ title, productDescription, executionDetails, usagePlace, quantity, influencerIds[], externalNames[{ name, note }] }`
- `POST /service-requests` `{ influencerUserId, title, details }`

Admin (`role = admin`)
- `GET /admin/stats`
- `GET /admin/accounts?role&status&search&page&limit`, `GET /admin/accounts/:id`
- `PATCH /admin/accounts/:id/status` `{ status, reason? }`
- `GET /admin/requests?status&kind&page&limit` (each item includes `requester`)
- `PATCH /admin/requests/:kind/:id` `{ status, rejectionReason? }` (`kind` = `ugc | service`; reason required for `rejected`)
- `GET|POST /admin/categories`, `PATCH|DELETE /admin/categories/:id` (delete refused while creators use it)
- `PUT /admin/platform-contact`

Creator profile fields: `gender, birthDate (18+), heightCm?, weightKg?, skinTone?, hairColor?, eyeColor?, hijab?, experienceYears, languages[], bio (≥20), locationScope, governorateId | countryId, categoryIds[] (specialties), socialAccounts[{ platform, handle }]`.

Uploads are stored in `UPLOAD_DIR` (default `./uploads`) and served at `/uploads/<userId>/<file>`; JPG/PNG/WEBP up to `MAX_UPLOAD_MB`.
