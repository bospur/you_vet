# YouVet — краткий контекст проекта

> Последнее обновление: 2026-08-21 (передача)

## Что это

SaaS для ветклиник: **Telegram Mini App** (клиенты) + **веб-admin** (персонал) + **Go API** + **PostgreSQL** + **Telegram-бот** + **mobile app** (RuStore) + **docs-портал**.

## Prod

| Сервис | URL |
|---|---|
| Бот | @VPract_bot |
| Mini App | https://app.bospur.ru |
| Admin | https://admin.bospur.ru |
| API | https://api.bospur.ru |
| Docs portal | https://docs.bospur.ru |
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
| B1–B4, C1, Q1 | 🟡 код на `*.bospur.ru`; C1 smoke |

Миграции **013–017** (запись), **019–021** (mobile), **022–025** (docs-портал / канбан).

### Mobile — RuStore v1 «Ветпрактика»

| Этап | Статус |
|---|---|
| M0 backend API + auth | ✅ prod |
| M1 Capacitor shell + контент | ✅ APK |
| M2 auth UX + гостевой режим + polish | 🟡 пересборка APK на `api.bospur.ru` |
| M2b booking flow | backlog **sprint 5** |
| M3 RuStore | backlog |
| **iOS shell** | ⏸ `ios/` + `@capacitor/ios@7`; симулятор после Xcode |

`appId`: `ru.snzbeachvolleyball25.vetpraktika` · API: `/api/mobile/v1`

## Git

- `dev` — деплой по push (`deploy-server` / `deploy-admin` / `deploy-app` / `deploy-docs` по paths)
- Текущая фича-ветка сессии: `work-doc-portal`

## Ключевые документы

- [phase-5-appointments.md](../md/phases/phase-5-appointments.md)
- [portal/sales.md](../md/portal/sales.md)
- [mobile/design-mvp.md](../md/mobile/design-mvp.md) · [screen-specs.md](../md/mobile/screen-specs.md)
- [deployment.md](../md/general/deployment.md)
- [context/](./)
