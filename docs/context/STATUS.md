# Текущий статус проекта

> Последнее обновление: 2026-06-01 (передача)

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | 🟡 | вопросы + ответ врача — после **Deploy server**; Group Privacy off |
| Mini App | 🟡 | C1 polish + «Задать вопрос» — после **Deploy app** |
| Admin | ✅ / 🟡 | запись без изменений в этой сессии |
| API | 🟡 | 016, 017, отмена, questions — **Deploy server** |
| Docs portal | ✅ | phase-5 + booking-for-clinic sync 2026-06-01 |
| VPS | ✅ | SSH `vps`, миграции 016+017 с deploy server |

## Функциональность (MVP)

| Модуль | Admin | Mini App | API / бот |
|---|---|---|---|
| B1–B4 запись | 🟡 | 🟡 | 🟡 deploy |
| C1 запись UI | — | 🟡 | 🟡 |
| **Вопросы клиенту** | — | 🟡 код | 🟡 код |

## Фокус

1. Push `dev` → deploy **server + app**
2. VPS: **016** + **017**; BotFather privacy для группы врачей
3. Smoke: запись (отмена, слоты, вкладки) + вопрос → ответ в боте
4. Backlog: ADM-02, очередь на слот

## CI

`ci.yml` на push `dev`: Go test + lint/build + admin/app.
