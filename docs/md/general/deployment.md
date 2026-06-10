# Деплой и инфраструктура

> AI: загрузка памяти — **`контекст деплой`** · обновление HTML — **`портал`** (см. [CODEWORDS.md](../../CODEWORDS.md)).

## Сервер

| Параметр | Значение |
|---|---|
| IP | **213.176.65.71** (переезд 2026-06; ранее 194.87.0.94) |
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
| `/var/www/you-vet-docs` | HTML-документация (`docs/html/*`) |
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
| `COOKIE_SECURE` | `1` на prod (HTTPS) — флаг Secure для admin cookie |
| `COOKIE_DOMAIN` | `.snzbeachvolleyball25.ru` — общий домен admin + api |
| `PUBLIC_URL` | Базовый URL для фото (`https://api.snzbeachvolleyball25.ru`) |
| `APP_URL` | URL Mini App для кнопки в боте (`https://app.snzbeachvolleyball25.ru`) |
| `ADMIN_LOGIN` | Логин первого admin (только при первом запуске) |
| `ADMIN_PASSWORD` | Пароль первого admin (только при первом запуске) |
| `VK_APP_ID` | ID приложения VK ID (число) — mobile `POST /auth/vk` |
| `VK_APP_SECRET` | **Защищённый ключ** VK (не сервисный ключ) |
| `VK_REDIRECT_URI` | `https://oauth.vk.com/blank.html` (как в mobile `.env.local`) |
| `JWT_MOBILE_SECRET` | Опционально; иначе fallback `JWT_SECRET` |

## CI/CD

Актуальные workflows: `.github/workflows/` (корень репо).

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

> `deploy-app.yml` также следит за `packages/cat/**` — изменения в `@you-vet/cat` триггерят redeploy Mini App.

### Docs — `deploy-docs.yml`

Триггер: `docs/**`

1. `scp docs/html/*` → `/var/www/you-vet-docs/`

Markdown (`docs/md/`, `docs/context/`) в HTML-портал не деплоится — только через GitHub.

> **Если docs.snz… отдаёт admin или SSL-ошибка** — см. [docs-portal-restore.md](./docs-portal-restore.md) (диагностика и починка Nginx + cert на VPS).

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

## Docs-портал: если сломан

Симптомы: `docs.snzbeachvolleyball25.ru` показывает admin, SSL-ошибка в браузере.

Пошаговое восстановление: **[docs-portal-restore.md](./docs-portal-restore.md)**.

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

## Идеи (backlog инфраструктуры и ops)

> Не в реализации. Приоритизация — после стабилизации фазы 5 (запись) и C1.

### Мониторинг сервера в admin (суперадмин)

**Задача:** экран в веб-admin «Состояние системы» — без SSH и без отдельного Grafana на первом этапе.

| Блок | Что показывать |
|---|---|
| Сервисы | API / bot / DB: up, uptime, версия образа (`latest` digest или git sha из env) |
| Ресурсы | CPU/RAM/диск VPS (агент или периодический сбор по SSH — позже) |
| БД | размер, последняя миграция (`schema_migrations`), latency ping |
| Деплой | время последнего успешного Deploy server/admin (из GH Actions API или метка в БД) |
| Очереди | необработанные ошибки (см. ниже) |

**Доступ:** только роль **`superadmin`** (разработчик / владелец платформы), не путать с `admin` клиники.

- `admin` клиники — контент, запись, пользователи **своей** клиники.
- `superadmin` — платформа, все клиники (когда появится multi-tenant на одном инстансе), инфра, логи, флаги.

Технически: поле `role` в `users` + `superadminAuth` в `main.go`; UI — отдельный пункт меню или `/platform` (скрыт от обычных ролей). Первого superadmin завести миграцией или env `SUPERADMIN_LOGIN` по аналогии с `ADMIN_LOGIN`.

Связано: [roles.md](./roles.md) (сейчас ролей superadmin нет).

### Упрощённый «Sentry» (ошибки приложения)

**Задача:** не полноценный Sentry, а **свой лёгкий слой**, заточенный под известные уязвимые места кодовой базы.

Принцип: мы знаем, где чаще всего ломается — логировать и показывать в admin суперадмину структурированно, а не только `docker compose logs`.

| Источник | Что ловить |
|---|---|
| Go API | 5xx, необработанные ошибки repo, сбои миграций при старте, Telegram API errors |
| Критичные домены | booking (`availability`, заявки), auth/cookie, upload/MIME, initData Mini App |
| Admin / Mini App | `window.onerror`, rejected fetch к API (без PII в теле) |
| CI / deploy | failed workflow (webhook → запись в таблицу или Telegram dev-чат) |

**Модель данных (черновик):**

```text
error_events (id, source, level, fingerprint, message, context_json, clinic_id?, created_at)
```

- **fingerprint** — группировка («booking.availability.sql», «auth.cookie.missing»).
- **context** — route, status, user_id/clinic_id без паролей и токенов.
- Retention 7–30 дней; счётчик «повторов за 24ч» на экране мониторинга.

**Интеграции (по желанию позже):** экспорт в Telegram dev-канал; опционально forward в настоящий Sentry для prod.

**Не цель v1:** session replay, performance APM, алерты на каждый 404.

### Связь с текущим деплоем

| Сейчас | После идеи |
|---|---|
| Ошибки — `docker compose logs app` на VPS | Лента в admin + алерт при всплеске |
| CI красный, deploy зелёный — путаница | Плитка «последний CI / последний deploy» для superadmin |
| Ручной SSH — только аварийно | Основной путь: push `dev` → Actions; мониторинг подтверждает выкат |

### Порядок внедрения (предложение)

1. Роль `superadmin` + защищённые API `/api/platform/*` (health, version, recent errors).
2. Таблица `error_events` + middleware/handler wrapper на критичных роут booking/auth.
3. Экран «Мониторинг» в admin.
4. Webhook GitHub Actions → событие `deploy.succeeded` / `deploy.failed`.
5. Агент метрик VPS (опционально).

Завести трекинг: **INF-06** (мониторинг), **INF-07** (error_events) — см. [context/ISSUES.md](../../context/ISSUES.md).
