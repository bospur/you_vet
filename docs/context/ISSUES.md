# Известные проблемы и техдолг

> Последнее обновление: 2026-05-30

Легенда: 🔴 P0 · 🟠 P1 · 🟡 P2 · ⚪ P3

## Безопасность

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| SEC-01 | 🔴 | RBAC на бэкенде неполный | **fixed 2026-05-30** |
| SEC-02 | 🔴 | Update/delete без clinic_id | **fixed 2026-05-30** |
| SEC-03 | 🟠 | CORS `*` | **fixed 2026-05-30** |
| SEC-04 | 🟠 | JWT в localStorage (XSS surface) | open |
| SEC-05 | 🟠 | Rate limit на login | **fixed 2026-05-30** |
| SEC-06 | 🟡 | Загрузка файлов — только по расширению | open |
| SEC-07 | 🟡 | Telegram initData не валидируется | **fixed** (work-audit-clear) |

## Инфра / CI

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| INF-01 | 🟠 | Нет CI quality gate (test/lint/build) на PR | **fixed** — `ci.yml` |
| INF-02 | 🟡 | `deploy-app.yml` не следит за `packages/cat/**` | **fixed** |
| INF-03 | ⚪ | Дублирующие workflows в `apps/*/.github/` | open |
| INF-04 | ⚪ | `turbo: "latest"` не закреплён | open |

## Документация

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| DOC-01 … DOC-05 | — | См. audit.md | **fixed 2026-05-30** |
| DOC-06 | — | Roadmap + audit после hardening | **fixed 2026-05-30** |

## Продукт (из roadmap)

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| PRD-01 | 🔴 | Скрыть груминг если раздел пустой | **fixed** (work-audit-clear) |
| PRD-02 | 🟡 | Пересмотр архитектуры статей | **fixed** — животное → статьи, slug auto, prod |
| PRD-03 | ⚪ | Запись на приём | planned |
| PRD-04 | ⚪ | Аналитика | planned |

## Следующие шаги

1. PRD-03 — запись на приём (pending/confirm flow)
2. SEC-04 — JWT из localStorage в httpOnly cookie
3. SEC-06 — валидация загрузки файлов по MIME
