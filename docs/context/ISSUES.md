# Известные проблемы и техдолг

> Последнее обновление: 2026-05-30 · Источник: [audit.md](../audit.md)

Легенда: 🔴 P0 · 🟠 P1 · 🟡 P2 · ⚪ P3

## Безопасность

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| SEC-01 | 🔴 | RBAC на бэкенде неполный — groomer может вызывать content API через curl | open |
| SEC-02 | 🔴 | Update/delete без `clinic_id` в WHERE — IDOR при multi-clinic БД | open |
| SEC-03 | 🟠 | CORS `Access-Control-Allow-Origin: *` на admin API | open |
| SEC-04 | 🟠 | JWT в localStorage (XSS surface) | open |
| SEC-05 | 🟠 | Нет rate limit на `POST /api/admin/login` | open |
| SEC-06 | 🟡 | Загрузка файлов — проверка только по расширению | open |
| SEC-07 | 🟡 | Telegram initData не валидируется на бэкенде | open |

## Инфра / CI

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| INF-01 | 🟠 | Нет CI quality gate (test/lint/build) на PR | open |
| INF-02 | 🟡 | `deploy-app.yml` не следит за `packages/cat/**` | open |
| INF-03 | ⚪ | Дублирующие workflows в `apps/*/.github/` | open |
| INF-04 | ⚪ | `turbo: "latest"` не закреплён в root package.json | open |

## Документация

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| DOC-01 | 🟠 | README ссылался на несуществующий `docs/api.md` | **fixed 2026-05-30** |
| DOC-02 | 🟠 | `roles.md` утверждал полный backend RBAC | **fixed 2026-05-30** |
| DOC-03 | 🟠 | `deployment.md` описывал git pull вместо GHCR | **fixed 2026-05-30** |
| DOC-04 | 🟡 | `apps/admin/README.md` — битые относительные ссылки | **fixed 2026-05-30** |
| DOC-05 | 🟡 | HTML-портал: устаревшие claims про multitenancy/RBAC | **fixed 2026-05-30** |

## Продукт (из roadmap)

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| PRD-01 | 🔴 | Плитка «Груминг» видна даже если раздел пустой | open |
| PRD-02 | 🟡 | Пересмотр архитектуры статей (категории vs flat list) | open |
| PRD-03 | ⚪ | Запись на приём (pending/confirm flow) | planned |
| PRD-04 | ⚪ | Аналитика посещений | planned |

## Рекомендуемый порядок работ

1. SEC-01 + SEC-02 (middleware `RequireRole` + clinic-scoped mutations)
2. INF-01 (CI на PR)
3. PRD-01, SEC-07
4. INF-02, остальной техдолг
