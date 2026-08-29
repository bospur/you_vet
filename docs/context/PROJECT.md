# YouVet — краткий контекст проекта

> Последнее обновление: 2026-08-29 (PWA `apps/web`, сторы frozen)

## Что это

SaaS для ветклиник: **Telegram Mini App** (клиенты) + **веб-admin** (персонал) + **Go API** + **PostgreSQL** + **Telegram-бот** + **PWA / сайт** «Ветпрактика» + **docs-портал**. Capacitor APK/iOS в репо, публикация в сторы **заморожена**.

## Prod

| Сервис | URL |
|---|---|
| Бот | @VPract_bot |
| Mini App | https://app.bospur.ru |
| Admin | https://admin.bospur.ru |
| API | https://api.bospur.ru |
| Docs portal | https://docs.bospur.ru |
| Web / PWA | https://web.bospur.ru (после выкладки) |
| VPS | Ubuntu, `213.176.65.71`; SSH `vps` / `deploy` (только пользователь) |

## Монорепо

```
apps/server/     Go API + bot
apps/admin/      React 19 + MUI v7 (mobile-first < sm)
apps/app/        React 18 + Telegram UI
apps/web/        Vite + React 18 — PWA «Ветпрактика»
apps/mobile/     Capacitor — frozen
packages/types/  @you-vet/types
```

## Текущая работа

### Фаза 5 — запись

| Этап | Статус |
|---|---|
| B1–B4, C1, Q1 | 🟡 код на `*.bospur.ru`; C1 smoke Mini App; booking в PWA — следующий шаг |

Миграции **013–017** (запись), **019–021** (mobile JWT/VK), **022–026** (docs-портал / канбан / теги).

### Клиент вне Telegram — PWA

| Этап | Статус |
|---|---|
| M0 backend `/api/mobile/v1` | ✅ prod |
| `apps/web` PWA + десктоп-шелл | 🟡 в коде, ждёт DNS/nginx/`deploy-web` |
| Capacitor Android/iOS / RuStore | ⏸ **frozen** |

API: `/api/mobile/v1` · `appId` native: `ru.snzbeachvolleyball25.vetpraktika` (не менять)

## Git

- `dev` — деплой по push (`deploy-server` / `deploy-admin` / `deploy-app` / `deploy-docs` / **`deploy-web`**)
- `apps/mobile` не деплоится на `web.bospur.ru`

## Ключевые документы

- [phase-5-appointments.md](../md/phases/phase-5-appointments.md)
- [portal/sales.md](../md/portal/sales.md)
- [mobile/overview.md](../md/mobile/overview.md)
- [deployment.md](../md/general/deployment.md)
- [context/](./)
