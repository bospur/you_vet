# YouVet — краткий контекст проекта

> Последнее обновление: 2026-05-30

## Что это

SaaS для ветклиник: **Telegram Mini App** (клиенты) + **веб-admin** (персонал) + **Go API** + **PostgreSQL** + **Telegram-бот**.

## Prod (проверено 2026-05-30)

| Сервис | URL |
|---|---|
| Бот | @VPract_bot |
| Mini App | https://app.snzbeachvolleyball25.ru |
| Admin | https://admin.snzbeachvolleyball25.ru |
| API | https://api.snzbeachvolleyball25.ru |
| Docs portal | https://docs.snzbeachvolleyball25.ru |
| VPS | Ubuntu, пользователь `deploy`, SSH alias `vps` |

## Монорепо

```
apps/server/     Go API + bot (не npm workspace)
apps/admin/      React 19 + MUI v7
apps/app/        React 18 + Telegram UI
packages/types/  @you-vet/types
packages/cat/    @you-vet/cat (legacy; Mini App не использует с 2026-05-30)
```

Оркестрация фронтов: Turborepo + npm workspaces (корень).

## Модель деплоя

**Фактически:** один VPS = одна клиника (`CLINIC_SLUG`, `VITE_CLINIC_SLUG` в secrets).

**В схеме БД:** мультитенантность (`clinics`, `clinic_id` на таблицах). Tenant-scoping на update/delete — см. [ISSUES.md](./ISSUES.md) (SEC-02 fixed).

## CI/CD (актуальные workflows в `.github/workflows/`)

| Workflow | Триггер | Действие |
|---|---|---|
| `deploy-server.yml` | `apps/server/**` | Build → GHCR → SSH → `docker compose pull/up` |
| `deploy-admin.yml` | `apps/admin/**`, `packages/types/**` | npm build → scp → `/var/www/vp-bot-admin/` |
| `deploy-app.yml` | `apps/app/**`, `packages/types/**` | npm build → scp → `/var/www/vp-bot-app/` |
| `deploy-docs.yml` | `docs/**` | scp `docs/*.html` → `/var/www/you-vet-docs/` |

> Устаревшие дубликаты: `apps/*/.github/workflows/` — не используются.

## Git

- Основная ветка: `dev` (деплой по push)
- Не пушить напрямую в `dev` — только через PR

## Ключевые документы

- [audit.md](../audit.md) — технический аудит
- [architecture.md](../architecture.md) — схема системы
- [mobile/overview.md](../mobile/overview.md) — мобильное приложение (Capacitor, research)
- [server/api.md](../server/api.md) — API reference
- [roles.md](../roles.md) — роли (с фактическим состоянием RBAC на бэкенде)
