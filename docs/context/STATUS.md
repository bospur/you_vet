# Текущий статус проекта

> Последнее обновление: 2026-05-30

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ Работает | |
| Mini App | ✅ | Фаза 4 в prod; **polish + dark theme + M0-сбор** — после merge `work-doc-up` |
| Admin | ✅ | **«Обзор» + таблица visitors** — после merge `work-doc-up` |
| API | ✅ | миграция 012 в коде; применится при deploy server |
| Docs portal | ✅ | Обновится с push `docs/**` |
| VPS | ✅ | SSH `vps` |

## Функциональность (MVP)

| Модуль | Admin | Mini App | API |
|---|---|---|---|
| Контент (статьи, животные, врачи, груминг, о клинике) | ✅ | ✅ | ✅ |
| Главная: polish, haptic, «Сегодня в клинике», dark theme | — | ✅* | — |
| M0: учёт Telegram-пользователей | ✅* | — | ✅* |
| «Обзор»: summary + таблица `telegram_users` | ✅* | — | ✅* |
| Запись на приём | ❌ | ❌ | ❌ |
| Аналитика событий (PRD-04 полная) | ❌ | ❌ | ❌ |

\* — в ветке `work-doc-up`, ожидает merge в `dev` и деплой

## Фокус

1. Merge `work-doc-up` → `dev`, деплой server + admin + app
2. Фаза 5 — запись на приём

## CI

| Область | Статус |
|---|---|
| Go tests | middleware |
| CI PR | `ci.yml` |
| Deploy | path-based на `dev` |
