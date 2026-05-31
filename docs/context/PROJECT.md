# YouVet — краткий контекст проекта

> Последнее обновление: 2026-05-31

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
| B2 | Расписание, ёмкость, календарь 2 нед. | ✅ prod / код |
| B3 | Заявки + резерв + антиспам | ✅ код |
| B4 | Уведомления в чат врачей | ✅ код |
| C1 | Mini App | следующий |

Каталог: УЗИ ×3, кастрация/стерилизация (`cat_surgery`), рентген.

## Git

- `dev` — деплой по push
- `work-F-5` — активная ветка записи

## Ключевые документы

- [phase-5-appointments.md](../phase-5-appointments.md)
- [booking-for-clinic.html](../booking-for-clinic.html) — для директора
- [roles.md](../roles.md)
- [context/](./)
