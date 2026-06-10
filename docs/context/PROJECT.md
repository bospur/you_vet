# YouVet — краткий контекст проекта

> Последнее обновление: 2026-06-10 (передача)

## Что это

SaaS для ветклиник: **Telegram Mini App** (клиенты) + **веб-admin** (персонал) + **Go API** + **PostgreSQL** + **Telegram-бот** + **mobile app** (RuStore).

## Prod

| Сервис | URL |
|---|---|
| Бот | @VPract_bot |
| Mini App | https://app.snzbeachvolleyball25.ru |
| Admin | https://admin.snzbeachvolleyball25.ru |
| API | https://api.snzbeachvolleyball25.ru |
| Docs portal | https://docs.snzbeachvolleyball25.ru |
| VPS | Ubuntu, `213.176.65.71` (переезд 2026-06); SSH `vps` / `deploy` |

## Монорепо

```
apps/server/     Go API + bot
apps/admin/      React 19 + MUI v7 (mobile-first < sm)
apps/app/        React 18 + Telegram UI
apps/mobile/     Capacitor + React 18 — «Ветпрактика», RuStore
packages/types/  @you-vet/types
```

## Текущая работа

### Фаза 5 — запись

| Этап | Статус |
|---|---|
| B1–B4, C1, Q1 | 🟡 deploy / smoke |

Миграции **013–017** (+ **019** mobile).

### Mobile — RuStore v1 «Ветпрактика»

| Этап | Статус |
|---|---|
| M0 backend API + auth | ✅ prod |
| M1 Capacitor shell + контент | ✅ APK |
| M2 auth UX + гостевой режим + polish | 🟡 в коде, deploy APK |
| M2b booking flow | backlog **sprint 5** |
| M3 RuStore | backlog |

`appId`: `ru.snzbeachvolleyball25.vetpraktika` · API: `/api/mobile/v1`

## Git

- `dev` — деплой по push (`deploy-server` / `deploy-admin` / `deploy-app` / `deploy-docs` по paths)

## Ключевые документы

- [phase-5-appointments.md](../md/phases/phase-5-appointments.md)
- [mobile/design-mvp.md](../md/mobile/design-mvp.md) · [screen-specs.md](../md/mobile/screen-specs.md)
- [docs-portal-restore.md](../md/general/docs-portal-restore.md)
- [context/](./)
