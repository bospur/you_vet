# Архитектура системы

> Обновлено: 29 августа 2026. Prod-домены: `*.bospur.ru`. PWA: `web.bospur.ru`.

## Схема взаимодействия

```
Telegram
   │
   ├── Mini App (apps/app) ← https://app.bospur.ru
   │      └── GET /api/clinics/{slug}/*  (+ initData)
   │
   └── Бот (long polling, внутри Go-сервера)

Браузер (персонал)
   └── Админ-панель (apps/admin) ← https://admin.bospur.ru
          └── /api/admin/*  (httpOnly cookie + /api/admin/me)

Браузер (клиент)
   └── PWA «Ветпрактика» (apps/web) ← https://web.bospur.ru
          └── /api/mobile/v1/*  (mobile JWT; OTP в Telegram / VK ID)

Android / iOS «Ветпрактика» (apps/mobile, Capacitor) — **frozen**, сторы не публикуем
   └── тот же /api/mobile/v1/*

Документация команды
   └── https://docs.bospur.ru  (React SPA, apps/docs)

                    ↓ всё через Nginx на VPS

Nginx (Ubuntu, системный; не Docker)
   ├── admin.bospur.ru → /var/www/vp-bot-admin
   ├── app.bospur.ru   → /var/www/vp-bot-app
   ├── docs.bospur.ru  → /var/www/you-vet-docs
   ├── web.bospur.ru   → /var/www/you-vet-web
   └── api.bospur.ru   → 127.0.0.1:8080  (Docker Go)
                                           │
                                           ├── Go HTTP (GHCR-образ)
                                           └── PostgreSQL :5432 (Docker, наружу закрыт)
```

TLS: Let's Encrypt, отдельные сертификаты на каждый поддомен. `:443` должен слушать **nginx** (не VPN/xray).

## Приложения

| Каталог | Что |
|---|---|
| `apps/server` | Go API + Telegram-бот + миграции |
| `apps/admin` | React 19 + MUI v7, mobile-first `< sm` |
| `apps/app` | Telegram Mini App (React 18) |
| `apps/mobile` | Capacitor «Ветпрактика» — **frozen** (сторы) |
| `apps/web` | PWA / сайт «Ветпрактика», `web.bospur.ru` |
| `apps/docs` | Портал документации |
| `packages/types` | `@you-vet/types` |

### apps/server

Слои: `HTTP → middleware → handler → repository → PostgreSQL`.

Миграции SQL в `apps/server/migrations/` (**001–021+**: контент, запись, вопросы, mobile/VK).

### apps/admin

Модули: animals, articles, doctors, grooming, booking, clinic-info, users, stats. JWT для персонала — cookie (`COOKIE_DOMAIN=.bospur.ru`).

### apps/app

Экраны: Home, статьи, врачи, расписание, груминг, запись (C1), «мои заявки», вопрос врачу.

### apps/mobile

Тот же контент + auth (телефон/OTP, VK) + ЛК. Запись в APK — sprint 5. `appId` (не менять): `ru.snzbeachvolleyball25.vetpraktika`.

## Модель деплоя vs схема данных

| Уровень | Состояние |
|---|---|
| PostgreSQL | Multi-tenant ready (`clinics`, `clinic_id`) |
| Production runtime | **Один VPS = одна клиника** (`CLINIC_SLUG`, `VITE_CLINIC_SLUG`) |
| Admin mutations | Create/update/delete в скоупе JWT `clinic_id` |

Подробнее: [roles.md](./roles.md), [deployment.md](./deployment.md).

## CI/CD

```
git push origin dev
       │
       ▼
GitHub Actions (path-based)
       │
       ├── apps/server/**     → Docker → GHCR → SSH → compose pull/up
       ├── apps/admin/**      → npm build → scp /var/www/vp-bot-admin/
       ├── apps/app/**        → npm build → scp /var/www/vp-bot-app/
       └── docs/**, apps/docs → npm build портала → scp /var/www/you-vet-docs/
```

Секрет сборки фронтов: `VITE_API_URL=https://api.bospur.ru`. Смена секрета **без** нового push admin/app не пересобирает `dist` — перезапустить workflow вручную.

`docs/html/` — legacy, **не** деплоится.

## Схема данных (кратко)

```
clinics
  └── users (admin / editor / groomer / manager)
  └── clinic_info, animals → articles, doctors + schedules
  └── grooming_*, booking_*, client questions
  └── telegram_users, mobile_users (OTP / VK)
```

Публичный API: клиника по `clinicSlug`. Admin: `clinic_id` из сессии. Бот: `CLINIC_SLUG`. Mobile: JWT `/api/mobile/v1`.
