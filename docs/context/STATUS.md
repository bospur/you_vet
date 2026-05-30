# Текущий статус проекта

> Последнее обновление: 2026-05-30

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ Работает | Проверено владельцем |
| Mini App | ✅ Задеплоен | app.snzbeachvolleyball25.ru |
| Admin | ✅ Задеплоен | admin.snzbeachvolleyball25.ru |
| API | ✅ Задеплоен | api.snzbeachvolleyball25.ru |
| Docs portal | ✅ Задеплоен | docs.snzbeachvolleyball25.ru |
| VPS доступ | ✅ Есть | SSH alias `vps` |

## Функциональность (MVP)

| Модуль | Admin | Mini App | API |
|---|---|---|---|
| Статьи (TipTap, draft/published) | ✅ | ✅ | ✅ |
| Животные / категории | ✅ | ✅ | ✅ |
| Врачи + расписание | ✅ | ✅ | ✅ |
| Груминг | ✅ | ✅ | ✅ |
| О клинике (лого, баннер) | ✅ | ✅ | ✅ |
| Безопасность admin API | ✅ Hardening 2026-05-30 | RequireRole, clinic_id, CORS, rate limit |
| Запись на приём | ❌ | ❌ | ❌ |
| Аналитика | ❌ | ❌ | ❌ |

## Фаза roadmap

**Фаза 3 — Готовность к запуску** (в работе):

- Скрытие груминга если раздел пустой
- Telegram initData валидация
- **Новое:** синхронизация документации (2026-05-30, в процессе)
- **Новое:** hardening безопасности admin API (запланировано, см. ISSUES.md)

## Тесты и CI

| Область | Статус |
|---|---|
| Go unit tests | 1 файл (`middleware/auth_test.go`) |
| Frontend tests | Нет |
| CI на PR (lint/test/build) | Нет |
| CI deploy | ✅ Path-based на push в `dev` |

## Документация

| Артефакт | Статус |
|---|---|
| Markdown в `docs/` | Обновляется (сессия 2026-05-30) |
| HTML-портал | Обновляется вместе с markdown |
| `docs/context/` | Создан для AI handoff |
