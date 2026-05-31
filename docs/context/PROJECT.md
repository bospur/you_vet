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
apps/admin/      React 19 + MUI v7
apps/app/        React 18 + Telegram UI
packages/types/  @you-vet/types
```

Turborepo + npm workspaces. `turbo` закреплён `2.8.21`.

## Модель деплоя

Один VPS = одна клиника (`CLINIC_SLUG`). БД multi-tenant ready.

## Текущая работа

| Тема | Статус |
|---|---|
| **Фаза 5 — запись** | Спека v2 утверждена → старт **B1** (admin услуги + manager) |
| Каталог | УЗИ, операции кошек (общий лимит), рентген |

## Git

- Основная ветка: `dev` (деплой по push)
- Активная ветка: `work-F-5`
- В `dev` — только через PR

## Ключевые документы

- [phase-5-appointments.md](../phase-5-appointments.md) — **план Фазы 5 v2**
- [roles.md](../roles.md) — роль `manager`
- [context/](./) — handoff для AI
