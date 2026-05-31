# Текущий статус проекта

> Последнее обновление: 2026-05-31

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ | Reply-меню + Mini App button; запись не реализована |
| Mini App | ✅ | Фаза 4 + polish |
| Admin | ✅ | техдолг cookie — в prod |
| API | ✅ | миграция 012 |
| Docs portal | ✅ | спека Ф5 v2 — обновить при деплое docs |
| VPS | ✅ | SSH `vps` |

## Функциональность (MVP)

| Модуль | Admin | Mini App | API |
|---|---|---|---|
| Контент | ✅ | ✅ | ✅ |
| M0: telegram_users + «Обзор» | ✅ | — | ✅ |
| Запись на приём (PRD-03) | 🚧 план B1 | ❌ | ❌ — **спека утверждена** |
| Аналитика полная (PRD-04) | ❌ | ❌ | ❌ |

## Фокус

1. **B1** — `booking_service_types`, роль `manager`, admin «Услуги»
2. B2–B3 — ёмкость и заявки
3. C1 — Mini App

## Техдолг

Закрыт в prod (кроме UI-02 NavGrid — deferred).

## CI

Go tests · `ci.yml` · path-based deploy на `dev`
