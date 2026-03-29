# Архитектура системы

## Схема взаимодействия

```
Telegram
   │
   ├── Mini App (apps/app) ← app.snzbeachvolleyball25.ru
   │      │
   │      └── GET /api/clinics/{slug}/*
   │
   └── Бот (long polling, внутри Go сервера)
          │
          └── GET /api/clinics/{slug}/* (внутренний)

Браузер (сотрудники клиники)
   │
   └── Админ-панель (apps/admin) → admin.snzbeachvolleyball25.ru
          │
          ├── POST /api/admin/login
          └── /api/admin/* (JWT Bearer)

                    ↓ всё через Nginx

Nginx (Ubuntu VPS, системный)
   │
   ├── admin.snzbeachvolleyball25.ru → /var/www/vp-bot-admin (статика)
   ├── app.snzbeachvolleyball25.ru   → /var/www/vp-bot-app   (статика)
   └── api.snzbeachvolleyball25.ru   → Go app :8080
                                           │
                                           ├── Go HTTP сервер (Docker)
                                           └── PostgreSQL :5432 (Docker)
```

## Приложения

### apps/server — Go бэкенд

```
main.go
internal/
├── db/           — подключение к БД, запуск миграций
├── repository/   — SQL запросы (animals, articles, doctors, users, grooming)
├── handler/      — HTTP хендлеры
├── middleware/   — JWT auth, CORS
└── bot/          — Telegram бот (long polling, htmlformat)
migrations/       — SQL файлы up/down (001–007)
```

Слои: `HTTP → middleware → handler → repository → PostgreSQL`

### apps/admin — Веб-панель

```
src/
├── data/source/      — axios вызовы к API (с Bearer interceptor)
├── modules/          — бизнес-модули (animals, articles, doctors, grooming, auth)
│   └── <module>/
│       ├── domain/types.ts   — типы модуля
│       └── features/         — компоненты (таблицы, диалоги)
├── screens/          — страницы (Layout + модули + логика)
└── shared/           — AuthContext, Layout, ProtectedRoute, ui-компоненты
```

### apps/app — Telegram Mini App

```
src/
├── api/          — запросы к публичному API
├── screens/      — Home, Animals, Categories, Articles, Article, Doctors, Doctor, Schedule
└── components/   — переиспользуемые компоненты
```

### packages/types — Общие TypeScript типы

Shared-пакет `@you-vet/types`, используется в `apps/admin` и `apps/app`.

```
src/
├── animals.ts    — Animal, Category
├── articles.ts   — Article, ArticleStatus
├── doctors.ts    — Doctor, DoctorSchedule, ClinicSettings, ScheduleEntry
├── grooming.ts   — GroomingBreed, GroomingTemplateSlot, GroomingAppointment
├── users.ts      — User
└── index.ts      — реэкспорт всего
```

## Мультитенантность

| Контекст | Как определяется клиника |
|---|---|
| Публичный API | `clinicSlug` в URL-пути |
| Admin API | `clinic_id` из JWT токена |
| Telegram бот | `CLINIC_SLUG` из переменной окружения |

## Контент статей

Статьи хранятся как HTML-строка (генерируется TipTap в админке):
- **Mini App** — рендерит HTML напрямую
- **Telegram бот** — конвертирует HTML → Telegram HTML через `htmlToTelegram()` (`internal/bot/htmlformat.go`)

## CI/CD

```
git push origin dev
       │
       ▼
GitHub Actions (path-based триггеры)
       │
       ├── apps/server/** → SSH → VPS → git pull → docker compose up --build -d
       ├── apps/admin/**  → npm build → scp dist/ → /var/www/vp-bot-admin/
       └── apps/app/**    → npm build → scp dist/ → /var/www/vp-bot-app/
```
