# Известные проблемы и техдолг

> Последнее обновление: 2026-05-31

Легенда: 🔴 P0 · 🟠 P1 · 🟡 P2 · ⚪ P3

## Безопасность

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| SEC-01 | 🔴 | RBAC на бэкенде неполный | **fixed 2026-05-30** |
| SEC-02 | 🔴 | Update/delete без clinic_id | **fixed 2026-05-30** |
| SEC-03 | 🟠 | CORS `*` | **fixed 2026-05-30** |
| SEC-04 | 🟠 | JWT в localStorage (XSS surface) | **fixed 2026-05-31** — httpOnly cookie + `/api/admin/me` |
| SEC-05 | 🟠 | Rate limit на login | **fixed 2026-05-30** |
| SEC-06 | 🟡 | Загрузка файлов — только по расширению | **fixed 2026-05-31** — sniff MIME + проверка расширения |
| SEC-07 | 🟡 | Telegram initData не валидируется | **fixed** (work-audit-clear) |

## Инфра / CI

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| INF-01 | 🟠 | Нет CI quality gate (test/lint/build) на PR | **fixed** — `ci.yml` |
| INF-02 | 🟡 | `deploy-app.yml` не следит за `packages/cat/**` | **fixed** (пакет больше не в Mini App) |
| INF-03 | ⚪ | Дублирующие workflows в `apps/*/.github/` | **fixed 2026-05-31** — удалены |
| INF-04 | ⚪ | `turbo: "latest"` не закреплён | **fixed 2026-05-31** — `2.8.21` |
| UI-01 | ⚪ | Dreamstime PNG в SVG-ассетах меню | **fixed** — inline SVG в `NavGrid/icons.tsx` |
| UI-02 | ⚪ | Выравнивание заголовков NavGrid при разной длине подписи | **deferred** — костыль: короткие подписи в одну строку |
| UI-03 | ⚪ | CatPreloader в Mini App | **fixed 2026-05-30** — зелёный CSS spinner |
| UI-04 | ⚪ | Картинка кота в блоке «О нас» на главной | **fixed 2026-05-30** |
| UI-05 | 🟡 | Прочие UI-правки по фидбеку заказчика | **fixed 2026-05-31** — новых пунктов нет |

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
| PRD-03 | ⚪ | Запись на приём | **in progress (B1)** — [phase-5-appointments.md](../phase-5-appointments.md) v2: слоты, manager, чат врачей |
| PRD-04 | ⚪ | Аналитика (полная) | planned — **Фаза 6**; **M0 subset fixed в коде** — `telegram_users` + дашборд «Обзор» |
| PRD-05 | ⚪ | Концепция баннера (текст / текст+картинка / превью → info-страница) | planned |
| PRD-06 | ⚪ | Mobile app (Capacitor, отдельный клиент) | research — см. [mobile/](../mobile/) |
| PRD-07 | ⚪ | Featured-статьи на главной (до 3) | **fixed** — миграция 011, фаза 4 |
| PRD-08 | ⚪ | Polish главной (haptic, сегодня в клинике, sticky звонок, skeleton/fallback) | **fixed 2026-05-30** — в prod |
| PRD-09 | ⚪ | Карточка клиента со штрихкодом (бот + Mini App → mobile) | planned — **Фаза 8**; интеграция с БД клиники по запросу |

## Следующие шаги

1. B1 → B3 запись ([phase-5-appointments.md](../phase-5-appointments.md))
2. C1 Mini App запись
3. PRD-04 шаг 2 — `analytics_events`
