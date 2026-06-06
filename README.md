# SmartCare — PostgreSQL Edition

A healthcare appointment management app built with **React + Vite** (frontend) and **Node.js + Express + PostgreSQL** (backend).

---

## Project structure

```
SmartCare_PostgreSQL/
├── server/
│   ├── db.js          ← PostgreSQL pool + helpers
│   ├── index.js       ← Express API (all routes)
│   ├── schema.sql     ← CREATE TABLE statements (run once)
│   ├── migrate.js     ← one-time JSON → PostgreSQL import
│   └── db.json        ← original data (used by migrate.js)
├── src/               ← React frontend (unchanged)
├── public/
├── .env.example       ← copy → .env and fill in credentials
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## Quick start

### 1 — Install dependencies
```bash
npm install
```

### 2 — Create a PostgreSQL database

**Local:**
```bash
psql -U postgres -c "CREATE DATABASE smartcare;"
```

**Docker (no local install needed):**
```bash
docker run --name smartcare-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=smartcare \
  -p 5432:5432 -d postgres:16
```

### 3 — Configure environment variables
```bash
cp .env.example .env
# open .env and set DB_HOST, DB_USER, DB_PASSWORD, etc.
```

### 4 — Create database tables
```bash
psql -U postgres -d smartcare -f server/schema.sql
```

### 5 — (Optional) Import existing data from db.json
```bash
npm run db:migrate
```
This is safe to re-run — uses `ON CONFLICT DO NOTHING`.

### 6 — Start the app
```bash
npm run dev:full          # starts both backend (:4000) and frontend (:5173)
```

Or separately:
```bash
npm run server            # Express API on :4000
npm run dev               # Vite on :5173
```

---

## Default login credentials

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@smartcare.app      | admin123    |
| Doctor  | meera@smartcare.app      | doctor123   |
| Doctor  | arjun@smartcare.app      | doctor123   |
| Patient | rahul@smartcare.app      | patient123  |

---

## Environment variables

| Variable      | Default                   | Description                         |
|---------------|---------------------------|-------------------------------------|
| `DB_HOST`     | `localhost`               | PostgreSQL host                     |
| `DB_PORT`     | `5432`                    | PostgreSQL port                     |
| `DB_NAME`     | `smartcare`               | Database name                       |
| `DB_USER`     | `postgres`                | Database user                       |
| `DB_PASSWORD` | *(empty)*                 | Database password                   |
| `DB_SSL`      | `false`                   | Set `true` for hosted databases     |
| `PORT`        | `4000`                    | Express server port                 |
| `CORS_ORIGIN` | `http://localhost:5173`   | Allowed CORS origin                 |

---

## npm scripts

| Command           | Description                                  |
|-------------------|----------------------------------------------|
| `npm run dev`     | Start Vite frontend only                     |
| `npm run server`  | Start Express backend only                   |
| `npm run dev:full`| Start both concurrently                      |
| `npm run build`   | Build frontend for production                |
| `npm run db:migrate` | Import db.json data into PostgreSQL       |

---

## Hosted databases (Supabase / Railway / Neon)

1. Create a project and copy the connection details into `.env`
2. Set `DB_SSL=true`
3. Run `psql <connection-string> -f server/schema.sql`
4. Run `npm run db:migrate`
