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
| Статьи (TipTap, draft/published, привязка к животному) | ✅ | ✅ | ✅ |
| Животные | ✅ | ✅ | ✅ |
| Врачи + расписание | ✅ | ✅ | ✅ |
| Груминг | ✅ | ✅ скрыт если пусто (PRD-01) | ✅ |
| О клинике (лого, баннер) | ✅ | ✅ | ✅ |
| Безопасность admin API | ✅ | — | RequireRole, clinic_id, CORS, rate limit |
| SEC-07 initData на публичном API | — | ✅ | ✅ |
| Запись на приём | ❌ | ❌ | ❌ |
| Аналитика | ❌ | ❌ | ❌ |

## Фаза roadmap

**Фаза 3 — Готовность к запуску** — завершена (2026-05-30):

- [x] PRD-01 — скрытие пустого груминга
- [x] SEC-07 — Telegram initData
- [x] Security hardening admin API
- [x] INF-01 — CI на PR + push в `dev`
- [x] PRD-02 — статьи без категорий, `articles.animal_id`
- [x] UX — кнопка «Наверх» в длинных статьях Mini App

**Следующий фокус:** Фаза 4 — запись на приём (PRD-03).

## Тесты и CI

| Область | Статус |
|---|---|
| Go unit tests | middleware (`auth`, `telegram_initdata`) |
| Frontend tests | Нет |
| CI на PR (lint/test/build) | ✅ `ci.yml` |
| CI deploy | ✅ Path-based на push в `dev` |

## Документация

| Артефакт | Статус |
|---|---|
| Markdown в `docs/` | Синхронизируется с кодом |
| HTML-портал | `roadmap.html`, `project-for-devs.html` обновлены 2026-05-30 |
| `docs/context/` | Handoff для AI |
