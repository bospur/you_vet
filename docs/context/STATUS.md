# Текущий статус проекта

> Последнее обновление: 2026-06-01

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ | `/link_staff` (B4) после деплоя server |
| Mini App | 🟡 | C1 (запись) — по ветке `dev`; см. phase-5 |
| Admin | 🟡 | `/booking` в prod; **CI lint fix** в очереди на push |
| API | 🟡 | BOOK-01 `d.full_name` — проверить Deploy server на VPS |
| Docs portal | 🟡 | `docs/context` обновлён 2026-06-01 |
| VPS | ✅ | SSH `vps`, `~/you_vet/apps/server` |

## Функциональность (MVP)

| Модуль | Admin | Mini App | API |
|---|---|---|---|
| Контент | ✅ | ✅ | ✅ |
| M0: telegram_users + «Обзор» | ✅ | — | ✅ |
| Запись B1 услуги + manager | ✅ | 🟡 | ✅ |
| Запись B2 расписание / ёмкость | 🟡 | 🟡 | 🟡 |
| Запись B3 заявки + антиспам | 🟡 | 🟡 | 🟡 |
| Запись B4 бот + staff-чат | 🟡 | 🟡 | 🟡 |
| Запись C1 клиентский UI | — | 🟡 | 🟡 public booking API |
| Аналитика полная (PRD-04) | ❌ | ❌ | ❌ |

## CI

`ci.yml` на push `dev`: Go test + `npm run lint` + build admin/app.

- **2026-06-01:** исправлены ошибки React Hooks v7 в admin (`preserve-manual-memoization`, `incompatible-library` для RHF/TanStack) — ожидается зелёный lint после push.

Деплои **отдельные** workflow по paths; CI и deploy не блокируют друг друга, но **красный CI = не мержить без фикса**.

## Фокус

1. Push → зелёный **Lint and build**
2. Deploy admin (если только lint-файлы) + smoke `/booking`
3. Deploy server/app при наличии других коммитов на `dev`; миграция **016** на VPS при schedule_style / time_slots
4. Smoke C1 в Mini App после deploy app

## Техдолг

UI-02 NavGrid — deferred. ADM-02 форма заявки в admin — backlog.
