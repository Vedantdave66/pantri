# Pantri

Smart inventory for restaurants — a mobile-first web app for tracking kitchen
stock, doing daily counts, and generating reorder lists.

Two roles:

- **Owner** — email/password login. Dashboard with today's count activity and
  discrepancy alerts, full inventory management, reorder list, staff management.
- **Employee** — 4-digit PIN login (created by the owner in the Staff tab).
  Sees only the Count screen, submits one blind count per day with an optional
  note for the owner.

## Stack

- **Frontend:** React + Vite (plain web app, not React Native)
- **Backend:** FastAPI (Python)
- **Database:** Supabase (PostgreSQL + Auth)
- **Deployment:** Vercel (frontend as static build, API as Python serverless function)

## Repo structure

```
pantri/
  frontend/          React + Vite app (4 screens: Login, Inventory, Count, Reorder)
  api/                FastAPI app (single serverless entrypoint: api/index.py)
    requirements.txt
  supabase/           SQL schema + seed data
    schema.sql
    seed.sql
  vercel.json         Wires frontend + api together on Vercel
```

## Local development

### 1. Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor to create `items` and
   `count_logs` tables (with RLS policies scoped to `auth.uid()`).
3. Create the restaurant owner's login under Authentication → Users
   (email + password, no self-signup in this MVP).
4. Copy that user's UUID and paste it into `supabase/seed.sql` in place of
   the placeholder `OWNER_USER_ID`, then run the seed script to load sample
   inventory.
5. Run `supabase/migration_v2.sql` to add the `profiles` table (roles + PINs),
   count attribution columns, and `items.expected_quantity`. It also backfills
   an owner profile for every existing auth user. Employee accounts are then
   created from inside the app (Staff tab), not in the Supabase dashboard.

### 2. Backend (FastAPI)

```bash
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, DATABASE_URL
uvicorn index:app --reload --port 8000
```

Env vars:

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_KEY` — the **service role** key (server-side only, never expose to the frontend)
- `DATABASE_URL` — Supabase Postgres connection string (reserved for future direct-SQL needs)

Note: the API validates `Authorization: Bearer <token>` headers by asking Supabase's
own Auth server to verify the token (`auth.get_user`), rather than decoding the JWT
locally. This avoids needing to keep a JWT signing secret in sync — it works whether
the project signs tokens with the legacy shared HS256 secret or the newer asymmetric
signing keys.

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env   # fill in VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```

Env vars:

- `VITE_API_URL` — where the FastAPI backend is running (e.g. `http://localhost:8000` locally, or omit in production if API is served from the same domain under `/api`)
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — reserved for any future direct Supabase client usage

Open `http://localhost:5173` — sign in with the owner account created above.

## API endpoints

| Method | Path                        | Who      | Description                                        |
| ------ | --------------------------- | -------- | --------------------------------------------------- |
| POST   | `/api/auth/login`           | anyone   | Owner sign-in with email/password                    |
| POST   | `/api/auth/pin-login`       | anyone   | Employee sign-in with 4-digit PIN                    |
| POST   | `/api/auth/logout`          | anyone   | Sign out                                             |
| GET    | `/api/me`                   | any auth | Current profile (id, role, full_name)                |
| POST   | `/api/auth/create-employee` | owner    | Create employee (name + PIN)                          |
| GET    | `/api/employees`            | owner    | List employees with last-active time                  |
| DELETE | `/api/employees/{id}`       | owner    | Remove an employee                                    |
| GET    | `/api/items`                | any auth | List items (quantities hidden for employees)          |
| POST   | `/api/items`                | owner    | Create an item                                        |
| PATCH  | `/api/items/{id}`           | owner    | Update name/unit/category/threshold/expected qty       |
| DELETE | `/api/items/{id}`           | owner    | Delete an item                                        |
| POST   | `/api/counts/submit`        | any auth | Batch count submission (+ optional note); employees limited to one per day |
| GET    | `/api/counts/mine/today`    | any auth | Whether the caller already submitted today            |
| POST   | `/api/items/{id}/count`     | any auth | Single-item count update (legacy)                     |
| GET    | `/api/counts/today`         | owner    | Today's logs grouped into per-employee submissions    |
| GET    | `/api/counts/latest`        | owner    | Latest count log per item                              |
| GET    | `/api/reorder`              | owner    | Items at or below their reorder threshold              |
| GET    | `/api/discrepancies`        | owner    | Today's counts >30% off `expected_quantity`            |

All routes except login/pin-login require `Authorization: Bearer <access_token>`.

## Deployment (Vercel)

`vercel.json` builds the frontend with `@vercel/static-build` and the API with
`@vercel/python`, routing `/api/*` to the FastAPI app and everything else to
the built frontend. Set the backend env vars (`SUPABASE_URL`,
`SUPABASE_SERVICE_KEY`, `DATABASE_URL`) and frontend env vars
(`VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel
project settings before deploying. Since the API is served from the same
domain under `/api`, `VITE_API_URL` can be left empty in production.

## Mobile / PWA

The app is mobile-first (max-width 430px, 48px minimum tap targets, 16px+
body text) and ships a PWA manifest (`frontend/public/manifest.json`) plus
home screen icons, so the owner can add it to their iPhone home screen from
Safari (Share → Add to Home Screen) and use it standalone.
