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

## Пути на сервере

| Путь | Что |
|---|---|
| `/home/deploy/vp-bot-server` | Go бэкенд (git + docker compose) |
| `/var/www/vp-bot-admin` | Статика админ-панели |
| `/var/www/vp-bot-app` | Статика Mini App |
| `/etc/nginx/sites-available/` | Nginx конфиги |
| `/etc/letsencrypt/live/` | SSL сертификаты |

## Переменные окружения на сервере (`.env`)

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | Строка подключения к PostgreSQL |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота |
| `CLINIC_SLUG` | Slug клиники для бота (`default`) |
| `JWT_SECRET` | Секрет для JWT |
| `PUBLIC_URL` | Базовый URL для фото врачей (`https://api.snzbeachvolleyball25.ru`) |
| `APP_URL` | URL Mini App для кнопки в боте (`https://app.snzbeachvolleyball25.ru`) |
| `ADMIN_LOGIN` | Логин первого admin (только при первом запуске) |
| `ADMIN_PASSWORD` | Пароль первого admin (только при первом запуске) |

## CI/CD

### Backend (`apps/server`)

Push в `dev` или изменения в `apps/server/**` → GitHub Actions:
1. SSH на VPS
2. `git pull origin dev`
3. `docker compose up --build -d`

### Frontend (`apps/admin`, `apps/app`)

Push в `dev` → GitHub Actions:
1. `npm ci`
2. `npm run build` (с VITE_* переменными из secrets)
3. `scp dist/` → VPS `/var/www/<app>/`

### GitHub Secrets (you_vet)

| Secret | Значение |
|---|---|
| `VPS_HOST` | 194.87.0.94 |
| `VPS_USER` | deploy |
| `VPS_SSH_KEY` | Приватный SSH ключ `~/.ssh/vp_bot_deploy` |
| `VITE_API_URL` | `https://api.snzbeachvolleyball25.ru` |
| `VITE_CLINIC_SLUG` | `default` |

## Ручной деплой бэкенда

```bash
ssh vps
cd /home/deploy/vp-bot-server
git pull origin dev
docker compose up --build -d
docker compose logs -f app   # проверить логи
```

## SSL сертификаты

Выдаются через Let's Encrypt (Certbot), обновляются автоматически каждые 90 дней.

```bash
# Получить сертификат для нового субдомена
sudo certbot certonly --webroot -w /var/www/certbot -d <subdomain>
```

## Docker (бэкенд)

| Сервис | Образ | Порт |
|---|---|---|
| app | Dockerfile (Go) | :8080 (только внутри Docker network) |
| db | postgres:16-alpine | :5432 (только внутри Docker network) |

Nginx проксирует `api.*` → `localhost:8080`, PostgreSQL снаружи недоступен.
