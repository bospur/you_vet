# Бэкенд — обзор

`apps/server` — Go HTTP сервер + Telegram бот.

## Структура файлов

```
apps/server/
├── main.go                  — точка входа: инициализация, все роуты, seed пользователя
├── go.mod / go.sum
├── Dockerfile
├── docker-compose.yml
├── .env.example
│
├── internal/
│   ├── db/
│   │   └── db.go            — подключение к PostgreSQL, запуск миграций
│   ├── repository/
│   │   ├── animals.go       — animals, categories (CRUD)
│   │   ├── articles.go      — articles, article_categories (CRUD)
│   │   ├── clinic_info.go   — clinic_info (upsert, image URLs)
│   │   ├── doctors.go       — doctors, schedules, exceptions, settings
│   │   ├── grooming.go      — grooming_breeds, template, appointments
│   │   └── users.go         — users
│   ├── handler/
│   │   ├── admin.go         — авторизация, animals/categories/articles/users CRUD
│   │   ├── animals.go       — публичный GET animals, categories
│   │   ├── articles.go      — публичный GET articles
│   │   ├── clinic_info.go   — GET/PUT clinic-info + загрузка logo/banner
│   │   ├── doctors.go       — врачи, расписание, исключения, настройки
│   │   ├── grooming.go      — груминг
│   │   └── helpers.go       — writeJSON
│   ├── middleware/
│   │   ├── auth.go          — JWT middleware (извлекает claims в context)
│   │   ├── auth_test.go
│   │   └── cors.go          — CORS middleware
│   └── bot/
│       ├── bot.go           — Telegram бот (long polling, навигация)
│       ├── doctors.go       — команды врачей и расписания
│       └── htmlformat.go    — конвертер HTML → Telegram HTML
│
└── migrations/
    ├── 001_create_animals
    ├── 002_create_categories
    ├── 003_create_articles
    ├── 004_add_multitenancy   — таблица clinics, clinic_id везде
    ├── 005_add_article_status
    ├── 006_create_doctors     — doctors, doctor_schedules, exceptions, clinic_settings
    ├── 007_create_grooming    — grooming_breeds, grooming_weekly_template, appointments
    └── 008_create_clinic_info — clinic_info (name, description, phone, address, email, website, logo_url, banner_url)
```

## Слои

```
HTTP запрос
    │
    ▼
middleware.CORS  —  для всех запросов
    │
    ▼
middleware.Auth  —  только для /api/admin/* (JWT Bearer)
    │
    ▼
handler  —  читает запрос, вызывает repository, отвечает JSON
    │
    ▼
repository  —  SQL запросы через database/sql
    │
    ▼
PostgreSQL
```

## Мультитенантность

| Контекст | Клиника |
|---|---|
| Публичный API | `clinicSlug` в URL `/api/clinics/{slug}/...` |
| Admin API | `clinic_id` из JWT; RBAC + scoping в update/delete |
| Telegram бот | `CLINIC_SLUG` из env |

**Production:** один VPS = одна клиника. Схема multi-tenant ready. См. [roles.md](../roles.md), [audit.md](../audit.md).

## Переменные окружения

| Переменная | Обязательная | Описание |
|---|---|---|
| `DATABASE_URL` | да | Строка подключения к PostgreSQL |
| `TELEGRAM_BOT_TOKEN` | да | Токен Telegram бота |
| `CLINIC_SLUG` | да | Slug клиники для бота |
| `JWT_SECRET` | да | Секрет для подписи JWT |
| `PUBLIC_URL` | нет | Базовый URL для фото (default: `https://api.snzbeachvolleyball25.ru`) |
| `APP_URL` | нет | URL Mini App для кнопки в боте |
| `UPLOADS_DIR` | нет | Путь к папке загрузок (default: `./uploads`) |
| `ADMIN_LOGIN` | первый запуск | Логин первого admin |
| `ADMIN_PASSWORD` | первый запуск | Пароль первого admin |
| `TELEGRAM_INITDATA_SKIP` | нет | `1` — отключить проверку initData (локальная разработка) |
| `TELEGRAM_INITDATA_MAX_AGE` | нет | Макс. возраст initData в секундах (default: 86400) |
| `CORS_ORIGINS` | нет | Whitelist origins через запятую |

## Авторизация

JWT middleware проверяет **валидность токена**, не роль. Role checks — выборочно в handlers.
Матрица: [roles.md](../roles.md).

JWT: `Authorization: Bearer <token>`, 24ч, claims `user_id`, `clinic_id`, `role`. Пароли — bcrypt.

### Mini App (публичный API)

Эндпоинты `/api/clinics/{slug}/...` требуют заголовок `X-Telegram-Init-Data` с подписанными данными Telegram Web App.
Проверка: HMAC-SHA256 по [документации Telegram](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
`/uploads/` — без initData (прямая загрузка картинок).

## Первый запуск

При старте, если таблица `users` пустая, автоматически создаётся admin
из `ADMIN_LOGIN` / `ADMIN_PASSWORD`. Последующих пользователей создаёт admin через панель.

## Загрузка файлов

Фото врачей, логотипы и баннеры хранятся в `UPLOADS_DIR` (папка на диске).
Сервер отдаёт их через `/uploads/{filename}` (static file server).
Формат имени: `clinic_{id}_{kind}_{timestamp}.{ext}` или `doctor_{id}_{timestamp}.{ext}`.
Допустимые форматы: JPG, PNG, WebP. Максимум 5 МБ.

## Материалы

| Тема | Ссылка |
|---|---|
| Go Tour | https://go.dev/tour/ |
| Effective Go | https://go.dev/doc/effective_go |
| net/http | https://pkg.go.dev/net/http |
| golang-migrate | https://github.com/golang-migrate/migrate |
| golang-jwt | https://pkg.go.dev/github.com/golang-jwt/jwt/v5 |
| telebot.v3 | https://pkg.go.dev/gopkg.in/telebot.v3 |
| PostgreSQL 16 | https://www.postgresql.org/docs/16/ |
