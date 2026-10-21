# Bareeq — creator platform

Iraqi platform connecting creators and models with brands.

```
Influencers-web/   Next.js 15 site (Arabic RTL + English), ports of design/reference/*
backend/           Node.js (Express) + PostgreSQL API — see backend/README.md
```

## Run locally

Requirements: Node.js 20+, PostgreSQL.

```bash
# API (port 4000)
cd backend
cp .env.example .env        # set DATABASE_URL, JWT_SECRET, ADMIN_* 
npm install
npm run db:setup            # tables + categories, governorates, countries, admin account
npm run dev

# Site (port 3000) — proxies /api and /uploads to the API (API_ORIGIN, default http://127.0.0.1:4000)
cd Influencers-web
npm install
npm run dev
```

Open http://localhost:3000/ar — the admin area is at `/ar/admin` (log in with the `ADMIN_*` account from `backend/.env`).
