# Pantri

Inventory tracking for independent restaurants — a mobile-first web app for
tracking kitchen stock, doing daily counts, and generating reorder lists.

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

### 2. Backend (FastAPI)

```bash
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET, DATABASE_URL
uvicorn index:app --reload --port 8000
```

Env vars:

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_KEY` — the **service role** key (server-side only, never expose to the frontend)
- `JWT_SECRET` — Supabase project JWT secret (Settings → API), used to verify the access tokens issued by `/api/auth/login`
- `DATABASE_URL` — Supabase Postgres connection string (reserved for future direct-SQL needs)

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

| Method | Path                    | Description                                      |
| ------ | ----------------------- | ------------------------------------------------- |
| POST   | `/api/auth/login`       | Sign in with email/password, returns access token |
| POST   | `/api/auth/logout`      | Sign out                                           |
| GET    | `/api/items`            | List all items for the current user                |
| POST   | `/api/items`            | Create an item                                     |
| PATCH  | `/api/items/{id}`       | Update an item's name/unit/threshold/category       |
| DELETE | `/api/items/{id}`       | Delete an item                                     |
| POST   | `/api/items/{id}/count` | Update `current_quantity`, logs to `count_logs`     |
| GET    | `/api/reorder`          | Items at or below their reorder threshold           |

All `/api/items*` and `/api/reorder` routes require `Authorization: Bearer <access_token>`
from `/api/auth/login`.

## Deployment (Vercel)

`vercel.json` builds the frontend with `@vercel/static-build` and the API with
`@vercel/python`, routing `/api/*` to the FastAPI app and everything else to
the built frontend. Set the backend env vars (`SUPABASE_URL`,
`SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `DATABASE_URL`) and frontend env vars
(`VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel
project settings before deploying. Since the API is served from the same
domain under `/api`, `VITE_API_URL` can be left empty in production.

## Mobile / PWA

The app is mobile-first (max-width 430px, 48px minimum tap targets, 16px+
body text) and ships a PWA manifest (`frontend/public/manifest.json`) plus
home screen icons, so the owner can add it to their iPhone home screen from
Safari (Share → Add to Home Screen) and use it standalone.
