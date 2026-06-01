# Текущий статус проекта

> Последнее обновление: 2026-06-01

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ | `/link_staff`, уведомления с **временем** после deploy server |
| Mini App | 🟡 | **C1 в коде на `dev`** — после deploy app: запись, слоты, отмена |
| Admin | 🟡 | `/booking` + новые правила услуг — после deploy admin |
| API | 🟡 | BOOK-01, 016, лимиты, отмена — **Deploy server** |
| Docs portal | ✅ | phase-5 + booking-for-clinic обновлены 2026-06-01 |
| VPS | ✅ | SSH `vps`, `~/you_vet/apps/server` |

## Функциональность (MVP) — запись

| Модуль | Admin | Mini App | API |
|---|---|---|---|
| B1 услуги + manager | ✅ | — | ✅ |
| B2 расписание / календарь | 🟡 | 🟡 | 🟡 |
| B3 заявки + лимиты по кличке | 🟡 | 🟡 | 🟡 |
| B4 бот + staff-чат | 🟡 | — | 🟡 |
| C1 клиентский UI | — | 🟡 код готов | 🟡 |

## Фокус

1. Push `dev` → CI green → deploy **server + app + admin**
2. Миграция **016** на prod
3. Smoke C1 end-to-end + настройка услуг (лимиты, УЗИ по времени)
4. Backlog: ADM-02, очередь на слот

## CI

`ci.yml` на push `dev`: Go test + lint/build — admin lint исправлен 2026-06-01.
