# Текущий статус проекта

> Последнее обновление: 2026-05-31

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ | Reply-меню + Mini App; запись не реализована |
| Mini App | ✅ | Фаза 4 + polish |
| Admin | ✅ | Запись B1+B2 (миграции 013–014) |
| API | ✅ | booking API |
| Docs portal | ✅ | booking-for-clinic.html |
| VPS | ✅ | SSH `vps` |

## Функциональность (MVP)

| Модуль | Admin | Mini App | API |
|---|---|---|---|
| Контент | ✅ | ✅ | ✅ |
| M0: telegram_users + «Обзор» | ✅ | — | ✅ |
| Запись B1 услуги + manager | ✅ | ❌ | ✅ |
| Запись B2 расписание / ёмкость | ✅ | ❌ | ✅ |
| Запись B3 заявки | ✅ | ❌ | ✅ |
| Аналитика полная (PRD-04) | ❌ | ❌ | ❌ |

## Admin — мобильная адаптация

Все экраны admin, включая **Запись** (`/booking/*`), следуют общему правилу: breakpoint `sm`, таблицы → карточки, `fullScreen` диалоги, scrollable tabs. См. [../apps/admin/README.md](../apps/admin/README.md).

## Фокус

1. **C1** — Mini App запись + «Мои заявки»
2. B5 — тесты, polish

## Техдолг

UI-02 NavGrid — deferred.

## CI

Go tests · `ci.yml` · deploy на `dev`
