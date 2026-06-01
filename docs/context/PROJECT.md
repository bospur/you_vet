# YouVet — краткий контекст проекта

> Последнее обновление: 2026-06-01 (передача)

## Что это

SaaS для ветклиник: **Telegram Mini App** (клиенты) + **веб-admin** (персонал) + **Go API** + **PostgreSQL** + **Telegram-бот**.

## Prod

| Сервис | URL |
|---|---|
| Бот | @VPract_bot |
| Mini App | https://app.snzbeachvolleyball25.ru |
| Admin | https://admin.snzbeachvolleyball25.ru |
| API | https://api.snzbeachvolleyball25.ru |
| Docs portal | https://docs.snzbeachvolleyball25.ru |
| VPS | Ubuntu, `deploy`, SSH alias `vps` |

## Монорепо

```
apps/server/     Go API + bot
apps/admin/      React 19 + MUI v7 (mobile-first < sm)
apps/app/        React 18 + Telegram UI
packages/types/  @you-vet/types
```

## Текущая работа — Фаза 5 запись

| Этап | Содержание | Статус |
|---|---|---|
| B1 | Услуги, роль `manager` | ✅ prod |
| B2 | Расписание, ёмкость, календарь | 🟡 prod + фикс SQL `d.full_name` |
| B3 | Заявки + резерв + антиспам | 🟡 deploy server после фикса |
| B4 | Бот: `/link_staff`, уведомления | 🟡 |
| C1 | Mini App запись | 🟡 deploy app |
| Q1 | «Задать вопрос» → чат врачей | 🟡 deploy server+app, миграция **017** |

Admin: **`/booking`**. Миграции **013–017**.

## Git

- `dev` — деплой по push (`deploy-server` / `deploy-admin` по paths)
- `work-F-5` — ветка фазы 5

## Ключевые документы

- [phase-5-appointments.md](../phase-5-appointments.md)
- [booking-for-clinic.html](../booking-for-clinic.html)
- [roles.md](../roles.md)
- [context/](./)
