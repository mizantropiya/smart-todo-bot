# Smart To-Do Bot

Telegram Mini App для управления персональным списком задач.

Пользователь открывает приложение через Telegram-бота, работает со списком задач в Mini App, а данные сохраняются в PostgreSQL и изолируются по Telegram user ID.

## Demo

- Telegram Bot: [@mysmarttodooo_bot](https://t.me/mysmarttodooo_bot)
- Mini App: [https://smart-todo-bot-1.onrender.com](https://smart-todo-bot-1.onrender.com)
- Backend API: [https://smart-todo-bot-wpse.onrender.com](https://smart-todo-bot-wpse.onrender.com)
- Health Check: [https://smart-todo-bot-wpse.onrender.com/api/health](https://smart-todo-bot-wpse.onrender.com/api/health)

## Возможности

- Запуск через команду `/start` в Telegram.
- Кнопка `Открыть список задач` в сообщении бота.
- Telegram Mini App с mobile-first интерфейсом.
- Создание задач.
- Отметка задачи выполненной и возврат в невыполненные.
- Удаление задач.
- Две визуальные секции: `Надо сделать` и `Сделано`.
- Persistence в PostgreSQL: данные сохраняются после повторного открытия приложения.
- Отдельный список задач для каждого Telegram-пользователя.
- Server-side Telegram authentication через signed `initData`.
- Sticky-note board дизайн.
- Loading, empty и error states.

Ограничения в текущем API:

- Максимум 160 символов на текст задачи.
- Максимум 99 задач на одного Telegram-пользователя.

## Технологии

### Frontend

- React
- TypeScript
- Vite
- TanStack Query

### Backend

- Node.js
- TypeScript
- Express
- Telegraf
- Zod

### Database

- PostgreSQL
- Prisma ORM
- Neon

### Infrastructure

- Render Static Site
- Render Web Service
- Docker / Docker Compose
- GitHub Actions

### Testing

- Vitest
- Supertest
- React Testing Library

## Архитектура

```text
Telegram User
      |
      v
Telegram Bot (Telegraf)
      |
      v
Web App Button
      |
      v
React Mini App
      |
      v
Telegram initData
      |
      v
Express Authentication Middleware
      |
      v
REST API
      |
      v
Task Service
      |
      v
Prisma
      |
      v
PostgreSQL / Neon
```

Frontend отвечает за Mini App UI, отправку signed Telegram `initData` и синхронизацию задач через REST API. Backend проверяет Telegram authentication, запускает bot/webhook режим и выполняет операции с задачами. Database хранит задачи с привязкой к server-authenticated Telegram user ID.

## Авторизация Telegram

Frontend получает raw `Telegram.WebApp.initData` внутри Telegram Mini App и отправляет его на backend в заголовке:

```text
Authorization: tma <raw-init-data>
```

Backend проверяет Telegram signature с использованием `BOT_TOKEN`, валидирует `auth_date`, извлекает signed `user.id` и только после этого использует его как owner ID для задач.

Frontend не может самостоятельно передать произвольный `telegramUserId` и получить чужие данные. `initDataUnsafe` не используется как доверенная server-side identity.

## Безопасность

- Все операции с задачами scoped authenticated Telegram user.
- User A не может читать задачи User B.
- User A не может изменять задачи User B.
- User A не может удалять задачи User B.
- Telegram `initData` проверяется на backend.
- Webhook защищен Telegram secret token.
- Development authentication отключен в production.
- Secrets передаются через Environment Variables.
- `.env` файлы не коммитятся.
- CORS в production ограничен frontend origin.
- API защищен от IDOR за счет user-scoped queries и mutations.

## Модель данных

Основная модель: `Task`.

| Field | Type | Description |
| --- | --- | --- |
| `id` | UUID | Идентификатор задачи |
| `telegramUserId` | string | Server-authenticated Telegram user ID |
| `text` | string | Текст задачи |
| `completed` | boolean | Статус выполнения |
| `createdAt` | DateTime | Дата создания |
| `updatedAt` | DateTime | Дата последнего обновления |

В Prisma schema есть индекс `@@index([telegramUserId, createdAt])` для выборок задач пользователя.

## REST API

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | No | Health check backend service |
| GET | `/api/tasks` | Yes | Получить задачи authenticated Telegram user |
| POST | `/api/tasks` | Yes | Создать задачу |
| PATCH | `/api/tasks/:id` | Yes | Обновить `completed` для своей задачи |
| DELETE | `/api/tasks/:id` | Yes | Удалить свою задачу |

POST `/api/tasks`:

```json
{
  "text": "Купить продукты"
}
```

PATCH `/api/tasks/:id`:

```json
{
  "completed": true
}
```

Коды ответов:

- `POST /api/tasks` возвращает `201`.
- `DELETE /api/tasks/:id` возвращает `204`.
- Validation errors возвращают `400`.
- Ошибка Telegram auth возвращает `401`.
- Задача не найдена или принадлежит другому пользователю возвращает `404`.
- Превышение лимита 99 задач возвращает `409` с code `TASK_LIMIT_REACHED`.

## Environment Variables

### Backend

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | Yes | Runtime environment: `development`, `test`, `production` |
| `PORT` | Yes | HTTP port, по умолчанию `4000` |
| `HOST` | Yes | Bind host, по умолчанию `0.0.0.0` |
| `DATABASE_URL` | Yes | PostgreSQL / Neon connection URL |
| `BOT_TOKEN` | Required for bot/auth | Telegram Bot Token из BotFather |
| `MINI_APP_URL` | Required when bot enabled | HTTPS URL frontend Mini App |
| `BOT_MODE` | Yes | `disabled`, `polling` или `webhook` |
| `WEBHOOK_BASE_URL` | Required for webhook | Public HTTPS backend URL |
| `WEBHOOK_PATH` | Required for webhook | Webhook path, например `/telegram/webhook` |
| `WEBHOOK_SECRET` | Required for webhook | Secret token для Telegram webhook |
| `CORS_ORIGIN` | Production yes | Allowed frontend origin |
| `TELEGRAM_INIT_DATA_MAX_AGE_SECONDS` | Yes | Max accepted age для Telegram `initData` |
| `DEV_AUTH_ENABLED` | Development only | Local browser auth fallback |
| `DEV_TELEGRAM_USER_ID` | Development only | Synthetic Telegram user ID для dev auth |

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Backend base URL |
| `VITE_DEV_AUTH_ENABLED` | Development only | Local browser auth fallback для Vite dev |
| `VITE_DEV_TELEGRAM_USER_ID` | Development only | Synthetic Telegram user ID для dev auth |

Не храните реальные `BOT_TOKEN`, `DATABASE_URL`, Neon password или `WEBHOOK_SECRET` в repository.

## Локальный запуск

```bash
git clone https://github.com/mizantropiya/smart-todo-bot.git
cd smart-todo-bot
```

Создайте локальные env files из примеров:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

На Windows файлы можно скопировать вручную.

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

По умолчанию frontend dev server запускается Vite, backend dev server запускается через `tsx watch`.

## Локальная разработка без Telegram

Обычный localhost browser не получает настоящий Telegram `initData`. Для локальной разработки предусмотрен dev auth.

Backend `.env`:

```text
NODE_ENV=development
DEV_AUTH_ENABLED=true
DEV_TELEGRAM_USER_ID=123456789
```

Frontend `.env`:

```text
VITE_DEV_AUTH_ENABLED=true
VITE_DEV_TELEGRAM_USER_ID=123456789
```

**Development authentication запрещен в production.** Backend принимает dev auth только при `NODE_ENV=development`, frontend отправляет dev auth только в Vite development mode.

## Docker

Запуск локального stack:

```bash
docker compose up --build
```

Compose поднимает local development stack:

- PostgreSQL: `localhost:5432`
- Backend: `http://localhost:4000`
- Vite frontend: `http://localhost:5173`
- Health endpoint: `http://localhost:4000/api/health`

Docker local frontend работает через development-only auth:

```text
VITE_API_URL=http://localhost:4000
VITE_DEV_AUTH_ENABLED=true
VITE_DEV_TELEGRAM_USER_ID=123456789
```

Production authentication по-прежнему требует Telegram `initData`.

PostgreSQL данные сохраняются в Docker volume `postgres_data`.

Остановка:

```bash
docker compose down
```

Полное удаление local DB volume:

```bash
docker compose down -v
```

`-v` удаляет локальные PostgreSQL данные.

## Миграции базы данных

Development:

```bash
cd backend
npm run prisma:migrate:dev
```

Production:

```bash
cd backend
npm run prisma:migrate:deploy
```

Не используйте `prisma migrate reset` для production.

## Тестирование

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

Тесты покрывают Telegram `initData`, invalid signature, expired auth, API validation, CRUD, user isolation, webhook routing, 160-character limit, лимит 99 задач и frontend components/states.

Integration tests используют in-memory task service и dev auth middleware. Production Neon database в тестах не используется.

## Настройка Telegram Bot

1. Открыть `@BotFather`.
2. Выполнить `/newbot`.
3. Получить Bot Token.
4. Добавить token в backend Environment Variables как `BOT_TOKEN`.
5. Настроить `MINI_APP_URL`.

Production Mini App URL должен быть HTTPS.

Текущий bot проекта: [@mysmarttodooo_bot](https://t.me/mysmarttodooo_bot).

## Polling для локальной разработки

Для локальной разработки bot можно запускать в polling mode:

```text
BOT_MODE=polling
```

Polling удобен, когда backend process сам получает Telegram updates. Не запускайте webhook и polling одновременно для одного bot token.

## Production Webhook

Production использует:

```text
BOT_MODE=webhook
WEBHOOK_BASE_URL=https://smart-todo-bot-wpse.onrender.com
WEBHOOK_PATH=/telegram/webhook
```

Telegram отправляет updates на публичный HTTPS backend. Backend проверяет `WEBHOOK_SECRET` через Telegram secret token header.

Реальное значение `WEBHOOK_SECRET` не публикуется.

## Production Deployment

Фактическая production схема:

- Frontend: Render Static Site
- Backend + Bot: Render Web Service
- Database: Neon PostgreSQL
- Bot mode: Telegram Webhook

### Frontend — Render Static Site

- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Environment:

```text
VITE_API_URL=https://smart-todo-bot-wpse.onrender.com
```

### Backend — Render Web Service

- Root Directory: `backend`
- Build Command: `npm ci && npm run prisma:generate && npm run build`
- Start Command: `npm start`
- Environment variable names:

```text
NODE_ENV=production
DATABASE_URL
BOT_TOKEN
BOT_MODE=webhook
WEBHOOK_BASE_URL=https://smart-todo-bot-wpse.onrender.com
WEBHOOK_PATH=/telegram/webhook
WEBHOOK_SECRET
MINI_APP_URL=https://smart-todo-bot-1.onrender.com
CORS_ORIGIN=https://smart-todo-bot-1.onrender.com
TELEGRAM_INIT_DATA_MAX_AGE_SECONDS=86400
DEV_AUTH_ENABLED=false
```

Не публикуйте реальные secret values.

## Deployment Order

1. Создать Neon PostgreSQL.
2. Получить `DATABASE_URL`.
3. Deploy backend на Render с `BOT_MODE=disabled`.
4. Проверить `https://smart-todo-bot-wpse.onrender.com/api/health`.
5. Deploy frontend на Render Static Site с `VITE_API_URL=https://smart-todo-bot-wpse.onrender.com`.
6. Получить frontend HTTPS URL.
7. В backend добавить `MINI_APP_URL` и `CORS_ORIGIN`.
8. Настроить `WEBHOOK_BASE_URL` и `WEBHOOK_SECRET`.
9. Переключить `BOT_MODE=webhook`.
10. Redeploy backend.
11. Открыть Telegram bot [@mysmarttodooo_bot](https://t.me/mysmarttodooo_bot).
12. Выполнить `/start`.
13. Открыть Mini App через кнопку `Открыть список задач`.

## Render Free Cold Start

Render Free Web Service может переходить в sleep после периода бездействия. Поэтому первый запрос после простоя иногда выполняется заметно дольше обычного. После запуска instance последующие запросы работают нормально.

## Troubleshooting

### Mini App показывает ошибку авторизации

- Открывайте приложение именно через кнопку Telegram-бота.
- Проверьте `BOT_TOKEN`.
- Проверьте системное время и `auth_date`.
- Проверьте backend logs.

### `/start` не отвечает

- Проверьте `BOT_MODE`.
- Проверьте webhook URL.
- Проверьте `WEBHOOK_SECRET`.
- Проверьте Render logs.

### CORS

- Проверьте, что `CORS_ORIGIN` точно совпадает с frontend origin.

### Первый запрос очень долгий

- Это может быть Render Free cold start после sleep.

### Frontend открыт напрямую в браузере

- Production Telegram auth не будет работать без Telegram `initData`.
- Для local development используйте documented dev auth.

## Структура проекта

```text
backend/
  prisma/
  src/
  tests/
  Dockerfile
  package.json

frontend/
  src/
  Dockerfile
  package.json

.github/
  workflows/

docker-compose.yml
README.md
```

## Основные решения

- Telegram `initData` проверяется на backend, frontend user ID не считается доверенным.
- Все task operations scoped authenticated Telegram user.
- PostgreSQL + Prisma используются для persistence.
- Telegraf webhook используется в production.
- TanStack Query отвечает за client synchronization после create/toggle/delete.
- Render + Neon выбраны как простая production-ready схема для тестового проекта.

## Ограничения

- Максимум 99 задач на пользователя.
- Максимум 160 символов на задачу.
- Render Free cold start может замедлить первый запрос после простоя.
- Priorities, due dates, tags, drag-and-drop и редактирование текста не реализованы, потому что не входят в текущий scope.

## GitHub CI

`.github/workflows/ci.yml` запускает backend и frontend checks на push в `main` и pull request. Backend job поднимает temporary PostgreSQL service, валидирует Prisma, применяет migrations, запускает lint/build/tests. Frontend job запускает lint/build/tests.
