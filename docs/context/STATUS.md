# Текущий статус проекта

> Последнее обновление: 2026-05-31

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ | |
| Mini App | ✅ | Фаза 4 + polish — **в prod** |
| Admin | ✅ | **в prod**; auth cookie — **ожидает деплой** (ветка work-F-5) |
| API | ✅ | миграция 012 |
| Docs portal | ✅ | План Ф5 — **ожидает деплой docs** |
| VPS | ✅ | SSH `vps` |

## Функциональность (MVP)

| Модуль | Admin | Mini App | API |
|---|---|---|---|
| Контент | ✅ | ✅ | ✅ |
| M0: telegram_users + «Обзор» | ✅ | — | ✅ |
| Запись на приём (PRD-03) | ❌ | ❌ | ❌ — **спланировано** |
| Аналитика полная (PRD-04) | ❌ | ❌ | ❌ |

## Фокус

1. Деплой техдолга (server + admin + docs)
2. Анкета директору → UX 5.0
3. **Фаза 5** — см. [phase-5-appointments.md](../phase-5-appointments.md)

## Техдолг

Закрыт (UI-02 NavGrid — deferred). Код на `work-F-5`, не в prod.

## CI

Go tests (middleware + upload) · `ci.yml` · path-based deploy на `dev`
