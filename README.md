# Telegram Mini App — Smart To-Do Bot

Smart To-Do Bot is a full-stack Telegram Mini App for a personal task list. Users open the Mini App from the Telegram bot, manage tasks in a React UI, and all task operations are protected by server-side validation of Telegram Mini Apps `initData`.

Telegram Bot: `@mysmarttodooo_bot`

## Stack

Backend:

- Node.js 22 LTS
- TypeScript
- Express
- Telegraf
- Zod
- Prisma ORM
- PostgreSQL
- Vitest + Supertest

Frontend:

- React
- TypeScript
- Vite
- TanStack Query
- React Testing Library

Infrastructure:

- Docker
- Docker Compose
- GitHub Actions CI
- Render Static Site for frontend
- Render Web Service for backend + bot
- Neon PostgreSQL

## Architecture

```text
Telegram User
↓
Telegram Bot / Telegraf
↓
Web App Button
↓
React Mini App
↓
raw Telegram initData
↓
Express Auth Middleware
↓
REST API
↓
Task Service
↓
Prisma
↓
PostgreSQL / Neon
```

## Repository Structure

```text
frontend/
  src/
  public/
  package.json
  .env.example
  Dockerfile

backend/
  src/
    auth/
    bot/
    config/
    lib/
    middleware/
    routes/
    tasks/
    types/
    app.ts
    server.ts
  prisma/
  tests/
  package.json
  .env.example
  Dockerfile

.github/workflows/ci.yml
docker-compose.yml
.gitignore
README.md
```

## Authentication Model

The frontend is not a trusted identity source. It never sends `telegramUserId` as the authority for ownership.

Telegram Mini Apps provide signed raw init data in `window.Telegram.WebApp.initData`. The frontend forwards this raw string on every protected API request:

```text
Authorization: tma <raw-init-data>
```

The backend validates the signature with `BOT_TOKEN`, checks `auth_date`, parses the signed `user`, converts `user.id` to a string, and only then sets the authenticated Telegram user context.

All task queries and mutations are scoped with that server-side `telegramUserId`. Supplying another user id from the browser, query string, or request body is not supported.

`window.Telegram.WebApp.initDataUnsafe` is used only as optional UI display data and is never used for authentication.

## REST API

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | No | Process health check for Render monitoring |
| GET | `/api/tasks` | Yes | List tasks for the authenticated Telegram user |
| POST | `/api/tasks` | Yes | Create a task for the authenticated Telegram user |
| PATCH | `/api/tasks/:id` | Yes | Mark a user's own task completed or incomplete |
| DELETE | `/api/tasks/:id` | Yes | Delete a user's own task |

Protected endpoints return `401` when Telegram auth fails. Invalid UUID params or invalid task text return `400`. Task text is trimmed and limited to 160 characters. Each Telegram user can store up to 99 tasks total; creating another task returns `409 TASK_LIMIT_REACHED`. A valid task id that belongs to another user returns `404`.

## Backend Environment

Create `backend/.env` locally. It is ignored by Git.

| Variable | Required | Example | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | Yes | `development` | Runtime environment |
| `PORT` | Yes | `4000` | HTTP port |
| `HOST` | Yes | `0.0.0.0` | Bind host for Render/Docker |
| `DATABASE_URL` | Yes | `postgresql://...` | PostgreSQL or Neon connection URL |
| `BOT_TOKEN` | Required for auth and bot | `<bot-token>` | Secret from BotFather |
| `BOT_USERNAME` | Yes | `mysmarttodooo_bot` | Public bot username without `@` |
| `MINI_APP_URL` | Required when bot enabled | `https://<frontend>.onrender.com` | HTTPS frontend URL for the Web App button |
| `CORS_ORIGIN` | Production yes | `https://<frontend>.onrender.com` | Allowed frontend origin |
| `BOT_MODE` | Yes | `disabled`, `polling`, `webhook` | Bot startup mode |
| `WEBHOOK_BASE_URL` | Webhook yes | `https://<backend>.onrender.com` | Public backend URL |
| `WEBHOOK_PATH` | Webhook yes | `/telegram/webhook` | Webhook route |
| `WEBHOOK_SECRET` | Webhook yes | `<strong-random-secret>` | Telegram secret token, use letters, digits, `_`, `-` |
| `TELEGRAM_INIT_DATA_MAX_AGE_SECONDS` | Yes | `86400` | Max accepted initData age |
| `DEV_AUTH_ENABLED` | Development only | `false` | Enables local browser auth fallback only in development |
| `DEV_TELEGRAM_USER_ID` | Development only | `123456789` | Synthetic local user id |

`DIRECT_URL` is not required by the current Prisma schema. If a future Neon setup requires a separate direct connection for migrations, add it deliberately instead of guessing it.

## Frontend Environment

Create `frontend/.env` locally if you need values different from defaults.

| Variable | Required | Example | Description |
| --- | --- | --- | --- |
| `VITE_API_URL` | Yes | `http://localhost:4000` | Backend base URL |
| `VITE_DEV_AUTH_ENABLED` | Development only | `false` | Enables local browser fallback only in Vite dev mode |
| `VITE_DEV_TELEGRAM_USER_ID` | Development only | `123456789` | Synthetic local user id |

Production builds do not fall back to dev auth automatically.

## Local Development

Backend:

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run dev
```

Frontend:

```bash
cd frontend
npm ci
npm run dev
```

For ordinary localhost browser testing without Telegram, enable development auth:

```text
backend/.env:
NODE_ENV=development
DEV_AUTH_ENABLED=true
DEV_TELEGRAM_USER_ID=123456789

frontend/.env:
VITE_DEV_AUTH_ENABLED=true
VITE_DEV_TELEGRAM_USER_ID=123456789
```

Do not enable dev auth in production. The backend ignores this fallback unless `NODE_ENV === "development"`.

## Docker

Validate Compose:

```bash
docker compose config
```

Run the local stack:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health: `http://localhost:4000/api/health`
- PostgreSQL: `localhost:5432`

The backend container applies migrations with `prisma migrate deploy` before starting.

## Testing

Backend:

```bash
cd backend
npm run lint
npm run build
npm test
npm run test:integration
npm run prisma:validate
npm run prisma:generate
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
npm test
```

Integration tests use an in-memory task service and dev auth middleware. They do not use the production or Neon database.

## Prisma Migrations

The migration is stored in:

```text
backend/prisma/migrations/20260904000000_create_tasks/migration.sql
```

Production migration command:

```bash
cd backend
npm run prisma:migrate:deploy
```

Do not use `prisma migrate reset` or `prisma db push --force-reset` in production.

## Telegram Bot Setup

For a new bot:

1. Open BotFather.
2. Run `/newbot`.
3. Create the bot and receive a token.
4. Put the token into backend environment as `BOT_TOKEN`.
5. Never commit the token.

This project is prepared for the existing bot:

```text
@mysmarttodooo_bot
```

## Polling Development

Use polling only for local development when you want the bot process to receive updates directly:

```text
BOT_MODE=polling
MINI_APP_URL=https://<public-https-frontend-url>
```

Telegram Mini Apps require HTTPS in real Telegram clients. A Render Static Site URL is suitable; plain localhost is not suitable for production Mini App launch.

## Production Webhook

Render production should use webhook mode:

```text
BOT_MODE=webhook
WEBHOOK_BASE_URL=https://<backend>.onrender.com
WEBHOOK_PATH=/telegram/webhook
WEBHOOK_SECRET=<strong-random-secret>
MINI_APP_URL=https://<frontend>.onrender.com
```

The backend checks Telegram's `X-Telegram-Bot-Api-Secret-Token` header on webhook requests.

## Render Backend Deployment

Create a Render Web Service:

- Root Directory: `backend`
- Build Command: `npm ci && npm run prisma:generate && npm run build`
- Start Command: `npm start`

Environment:

```text
NODE_ENV=production
DATABASE_URL=<Neon secret>
BOT_TOKEN=<BotFather secret>
BOT_USERNAME=mysmarttodooo_bot
CORS_ORIGIN=https://<frontend>.onrender.com
BOT_MODE=webhook
WEBHOOK_BASE_URL=https://<backend>.onrender.com
WEBHOOK_PATH=/telegram/webhook
WEBHOOK_SECRET=<strong-random-secret>
TELEGRAM_INIT_DATA_MAX_AGE_SECONDS=86400
DEV_AUTH_ENABLED=false
MINI_APP_URL=https://<frontend>.onrender.com
```

For the first backend deploy, use:

```text
BOT_MODE=disabled
```

Then deploy frontend, set the final frontend URL, switch backend to webhook mode, and redeploy.

## Render Frontend Deployment

Create a Render Static Site:

- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`

Environment:

```text
VITE_API_URL=https://<backend>.onrender.com
VITE_DEV_AUTH_ENABLED=false
```

## Production Deployment Order

1. Confirm Neon database exists.
2. Deploy backend to Render with `BOT_MODE=disabled`.
3. Get backend HTTPS URL.
4. Check `GET /api/health`.
5. Deploy frontend Render Static Site with `VITE_API_URL=<backend URL>`.
6. Get frontend HTTPS URL.
7. Update backend env: `MINI_APP_URL`, `CORS_ORIGIN`, `BOT_MODE=webhook`, `WEBHOOK_BASE_URL`, `WEBHOOK_SECRET`.
8. Redeploy backend.
9. Run `npm run prisma:migrate:deploy` as the production migration step if Render has not run it separately.
10. Send `/start` to `@mysmarttodooo_bot`.
11. Click `Открыть список задач`.
12. Verify create, toggle, delete, close, and reopen persistence.

## GitHub CI

`.github/workflows/ci.yml` installs backend and frontend dependencies, validates Prisma, applies migrations to a temporary PostgreSQL service, runs lint, builds both apps, and runs tests.

## Security

- Secrets are ignored via `.gitignore`.
- `BOT_TOKEN`, `DATABASE_URL`, and webhook secrets must stay out of source, docs, Dockerfiles, CI, frontend code, and bundles.
- The backend accepts dev auth only when `NODE_ENV === "development"` and `DEV_AUTH_ENABLED=true`.
- The frontend sends dev auth only when Vite is running in development mode.
- User A cannot list, patch, or delete User B's tasks because every operation is scoped by the server-authenticated Telegram user id.
- `auth_date` is checked with a default max age of `86400` seconds.
- Webhook mode validates Telegram's secret token header.

## Troubleshooting

- `401 Telegram authentication failed`: open the app inside Telegram or enable dev auth locally.
- `/start` has no button: set `MINI_APP_URL` and run backend with `BOT_MODE=polling` or `BOT_MODE=webhook`.
- Frontend cannot reach backend: check `VITE_API_URL` and backend CORS `CORS_ORIGIN`.
- Prisma cannot connect: verify `DATABASE_URL` and that migrations have been deployed.
- Telegram Mini App does not open: verify the frontend URL is HTTPS.

## Possible Improvements

- Task editing.
- Due dates.
- Optimistic UI updates.
- More granular frontend error messages.
- End-to-end tests against a disposable PostgreSQL database.
