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
   ├── docs.snzbeachvolleyball25.ru  → /var/www/you-vet-docs (HTML)
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
├── repository/   — SQL запросы (animals, articles, clinic_info, doctors, users, grooming)
├── handler/      — HTTP хендлеры
├── middleware/   — JWT auth, CORS
└── bot/          — Telegram бот (long polling, htmlformat)
migrations/       — SQL файлы up/down (001–008)
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
│   └── ClinicInfoScreen/     — О клинике: название, контакты, лого, баннер
└── shared/           — AuthContext, Layout, ProtectedRoute, ui-компоненты
```

### apps/app — Telegram Mini App

```
src/
├── api/          — запросы к публичному API (fetchClinicInfo, fetchAnimals…)
├── screens/      — Home, Animals, Categories, Articles, Doctors, Schedule, Grooming
└── components/   — NavGrid (2×2, tap-анимации), FeaturedArticles, NavList, DoctorAvatar…
```

### packages/types — Общие TypeScript типы

`@you-vet/types` — используется в `apps/admin` и `apps/app`.

### packages/cat — UI-компоненты

`@you-vet/cat` — CatLogo, CatPreloader (используется в Mini App).

## Модель деплоя vs схема данных

| Уровень | Состояние |
|---|---|
| PostgreSQL schema | Multi-tenant ready (`clinics`, `clinic_id`) |
| Production runtime | **Single-clinic per VPS** (`CLINIC_SLUG`, `VITE_CLINIC_SLUG`) |
| Admin mutations | Create scoped by JWT `clinic_id`; update/delete — частично без scoping |

Подробнее: [roles.md](./roles.md), [audit.md](./audit.md).

## CI/CD

```
git push origin dev
       │
       ▼
GitHub Actions (path-based триггеры)
       │
       ├── apps/server/**  → build image → GHCR → SSH → docker compose pull/up
       ├── apps/admin/**   → npm build → scp → /var/www/vp-bot-admin/
       ├── apps/app/**     → npm build → scp → /var/www/vp-bot-app/
       └── docs/**         → scp *.html → /var/www/you-vet-docs/
```

Workflows: `.github/workflows/deploy-{server,admin,app,docs}.yml`

## Схема данных

```
clinics
  └── users (admin/editor/groomer)
  └── clinic_info (название, описание, телефон, адрес, email, сайт, logo_url, banner_url)
  └── animals
       └── articles (animal_id, content — HTML от TipTap, status: draft/published, slug auto)
  └── doctors (status: draft/published)
       └── doctor_schedules (еженедельные слоты)
       └── doctor_schedule_exceptions (исключения на дату)
  └── clinic_settings (schedule_display_weeks)
  └── grooming_breeds (порода, duration, price)
  └── grooming_weekly_template (рабочие дни грумера)
  └── grooming_appointments (записи на конкретную дату)
```

Публичный API: клиника по `clinicSlug` в URL  
Admin API: клиника из JWT (`clinic_id`)  
Telegram бот: клиника из `CLINIC_SLUG` env

