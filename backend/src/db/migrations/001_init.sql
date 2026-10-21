-- Bareeq schema v1

CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  parent_id   INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name_ar     TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  image       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX categories_parent_idx ON categories(parent_id);

CREATE TABLE governorates (
  id       SERIAL PRIMARY KEY,
  name_ar  TEXT NOT NULL,
  name_en  TEXT,
  slug     TEXT UNIQUE
);

CREATE TABLE countries (
  id       SERIAL PRIMARY KEY,
  name_ar  TEXT NOT NULL,
  name_en  TEXT,
  code     TEXT UNIQUE
);

-- role:   user (normal account) | client (company) | influencer (creator / model) | admin
-- status: pending | approved | rejected | suspended
CREATE TABLE users (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  phone          TEXT UNIQUE,
  email          TEXT UNIQUE,
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('user', 'client', 'influencer', 'admin')),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  status_reason  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (phone IS NOT NULL OR email IS NOT NULL)
);
CREATE INDEX users_role_status_idx ON users(role, status);

CREATE TABLE client_profiles (
  user_id         INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  brand_name      TEXT,
  whatsapp        TEXT,
  contact_email   TEXT,
  location_scope  TEXT CHECK (location_scope IN ('inside_iraq', 'outside_iraq')),
  governorate_id  INTEGER REFERENCES governorates(id),
  country_id      INTEGER REFERENCES countries(id)
);

CREATE TABLE influencer_profiles (
  user_id           INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio               TEXT NOT NULL DEFAULT '',
  gender            TEXT CHECK (gender IN ('male', 'female')),
  birth_date        DATE,
  height_cm         INTEGER,
  weight_kg         INTEGER,
  skin_tone         TEXT,
  hair_color        TEXT,
  eye_color         TEXT,
  hijab             TEXT,
  experience_years  INTEGER NOT NULL DEFAULT 0,
  languages         TEXT[] NOT NULL DEFAULT '{}',
  location_scope    TEXT NOT NULL DEFAULT 'inside_iraq' CHECK (location_scope IN ('inside_iraq', 'outside_iraq')),
  governorate_id    INTEGER REFERENCES governorates(id),
  country_id        INTEGER REFERENCES countries(id),
  avatar            TEXT,
  cover             TEXT,
  availability      TEXT NOT NULL DEFAULT 'active' CHECK (availability IN ('active', 'busy', 'paused')),
  whatsapp          TEXT,
  contact_email     TEXT
);

CREATE TABLE influencer_categories (
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id  INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, category_id)
);
CREATE INDEX influencer_categories_category_idx ON influencer_categories(category_id);

CREATE TABLE social_accounts (
  id        SERIAL PRIMARY KEY,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform  TEXT NOT NULL,
  handle    TEXT NOT NULL
);
CREATE INDEX social_accounts_user_idx ON social_accounts(user_id);

CREATE TABLE portfolio_images (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX portfolio_images_user_idx ON portfolio_images(user_id);

-- Single-row table (id = 1).
CREATE TABLE platform_contact (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  company_name  TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  whatsapp      TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  address       TEXT NOT NULL DEFAULT '',
  website       TEXT NOT NULL DEFAULT '',
  instagram     TEXT NOT NULL DEFAULT '',
  tiktok        TEXT NOT NULL DEFAULT '',
  facebook      TEXT NOT NULL DEFAULT '',
  snapchat      TEXT NOT NULL DEFAULT '',
  x_account     TEXT NOT NULL DEFAULT ''
);

-- Request status: pending | reviewing | confirmed | closed | rejected
CREATE TABLE ugc_requests (
  id                   SERIAL PRIMARY KEY,
  requester_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  product_description  TEXT NOT NULL,
  execution_details    TEXT NOT NULL,
  usage_place          TEXT NOT NULL,
  quantity             INTEGER NOT NULL DEFAULT 1,
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'confirmed', 'closed', 'rejected')),
  rejection_reason     TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ugc_requests_requester_idx ON ugc_requests(requester_id);

CREATE TABLE ugc_request_faces (
  request_id     INTEGER NOT NULL REFERENCES ugc_requests(id) ON DELETE CASCADE,
  influencer_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (request_id, influencer_id)
);

CREATE TABLE ugc_request_guests (
  id          SERIAL PRIMARY KEY,
  request_id  INTEGER NOT NULL REFERENCES ugc_requests(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  note        TEXT
);

CREATE TABLE service_requests (
  id                SERIAL PRIMARY KEY,
  requester_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  influencer_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  details           TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'confirmed', 'closed', 'rejected')),
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX service_requests_requester_idx ON service_requests(requester_id);
