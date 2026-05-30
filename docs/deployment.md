# Деплой и инфраструктура

## Сервер

| Параметр | Значение |
|---|---|
| IP | 194.87.0.94 |
| OS | Ubuntu |
| Deploy пользователь | `deploy` |
| SSH ключ (локально) | `~/.ssh/vp_bot_deploy` |
| SSH алиас | `vps` |

## Домены и маршрутизация

| Домен | Назначение | Обслуживается |
|---|---|---|
| `api.snzbeachvolleyball25.ru` | Go API + Telegram бот | Docker (Go :8080) |
| `admin.snzbeachvolleyball25.ru` | Веб-панель | Nginx → `/var/www/vp-bot-admin` |
| `app.snzbeachvolleyball25.ru` | Telegram Mini App | Nginx → `/var/www/vp-bot-app` |
| `docs.snzbeachvolleyball25.ru` | HTML-документация | Nginx → `/var/www/you-vet-docs` |

## Пути на сервере

| Путь | Что |
|---|---|
| `/home/deploy/you_vet/apps/server` | Docker compose (Go + PostgreSQL), `.env` |
| `/var/www/vp-bot-admin` | Статика админ-панели |
| `/var/www/vp-bot-app` | Статика Mini App |
| `/var/www/you-vet-docs` | HTML-документация (`docs/*.html`) |
| `/etc/nginx/sites-available/` | Nginx конфиги |
| `/etc/letsencrypt/live/` | SSL сертификаты |

> Монорепо на VPS может присутствовать для справки, но **деплой сервера не использует git pull** — только pull Docker-образа из GHCR.

## Модель деплоя

**Текущая конфигурация:** один VPS = одна клиника.

| Переменная | Где | Назначение |
|---|---|---|
| `CLINIC_SLUG` | server `.env` | Бот + default clinic |
| `VITE_CLINIC_SLUG` | GitHub Secrets → CI build | Mini App + admin API paths |

Схема БД поддерживает несколько клиник (`clinic_id`), но runtime привязан к одному slug на инстанс.

## Переменные окружения на сервере (`.env`)

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | Строка подключения к PostgreSQL |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота |
| `CLINIC_SLUG` | Slug клиники для бота |
| `JWT_SECRET` | Секрет для JWT |
| `PUBLIC_URL` | Базовый URL для фото (`https://api.snzbeachvolleyball25.ru`) |
| `APP_URL` | URL Mini App для кнопки в боте (`https://app.snzbeachvolleyball25.ru`) |
| `ADMIN_LOGIN` | Логин первого admin (только при первом запуске) |
| `ADMIN_PASSWORD` | Пароль первого admin (только при первом запуске) |

## CI/CD

Актуальные workflows: `.github/workflows/` (корень репо).

> Устаревшие дубликаты в `apps/*/.github/workflows/` **не используются**.

### Backend — `deploy-server.yml`

Триггер: push в `dev` + изменения `apps/server/**`

1. Build Docker image в GitHub Actions
2. Push в GHCR: `ghcr.io/bospur/you_vet-server:latest`
3. SSH на VPS → `docker login ghcr.io` → `docker compose pull` → `docker compose up -d`

VPS **не собирает** образ локально и **не делает** `git pull` для деплоя сервера.

### Admin — `deploy-admin.yml`

Триггер: `apps/admin/**`, `packages/types/**`

1. `npm ci` → `npm run build` (с `VITE_*` из secrets)
2. `scp dist/` → `/var/www/vp-bot-admin/`

### Mini App — `deploy-app.yml`

Триггер: `apps/app/**`, `packages/types/**`

1. `npm ci` → `npm run build`
2. `scp dist/` → `/var/www/vp-bot-app/`

> ⚠️ Известный gap: `packages/cat/**` не в paths — изменения только в `@you-vet/cat` не триггерят redeploy app. См. [context/ISSUES.md](./context/ISSUES.md) INF-02.

### Docs — `deploy-docs.yml`

Триггер: `docs/**`

1. `scp docs/*.html` → `/var/www/you-vet-docs/`

Markdown (`docs/*.md`, `docs/context/`) в HTML-портал не деплоится — только через GitHub.

### GitHub Secrets

| Secret | Значение |
|---|---|
| `VPS_HOST` | IP VPS |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Приватный SSH ключ |
| `VITE_API_URL` | `https://api.snzbeachvolleyball25.ru` |
| `VITE_CLINIC_SLUG` | slug клиники (напр. `default`) |

## Ручной деплой

### Бэкенд (через GHCR)

```bash
ssh vps
cd /home/deploy/you_vet/apps/server
docker login ghcr.io -u <github-user>   # если сессия истекла
docker compose pull
docker compose up -d
docker compose logs -f app
```

### Локальная сборка образа (редко, для отладки)

```bash
cd apps/server
docker build -t you_vet-server:local .
# обновить docker-compose.yml временно на local image
```

### Фронтенд (ручной)

```bash
cd apps/admin   # или apps/app
VITE_API_URL=https://api.snzbeachvolleyball25.ru VITE_CLINIC_SLUG=default npm run build
scp -r dist/* vps:/var/www/vp-bot-admin/   # или vp-bot-app
```

## SSL сертификаты

Let's Encrypt (Certbot), auto-renew ~90 дней.

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d <subdomain>
```

## Docker (бэкенд на VPS)

| Сервис | Образ | Порт |
|---|---|---|
| app | `ghcr.io/bospur/you_vet-server:latest` | :8080 (localhost only) |
| db | postgres:16-alpine | :5432 (internal network) |

Nginx проксирует `api.*` → `localhost:8080`. PostgreSQL снаружи недоступен.
Uploads: volume `uploads_data` → `/app/uploads`.
