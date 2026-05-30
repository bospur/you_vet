# Текущий статус проекта

> Последнее обновление: 2026-05-30 (новая сессия)

## Git / деплой

| | |
|---|---|
| Активная ветка | `work-tech` |
| `dev` | Без security hardening (отстаёт на 2 коммита) |
| Prod API | Старая сборка до merge `work-tech` → `dev` |

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ Работает | @VPract_bot |
| Mini App | ✅ | app.snzbeachvolleyball25.ru |
| Admin | ✅ | admin.snzbeachvolleyball25.ru |
| API | ✅ | api.snzbeachvolleyball25.ru — **код hardening не задеплоен** |
| Docs portal | ✅ | docs.snzbeachvolleyball25.ru |
| VPS | ✅ | SSH alias `vps`, пользователь `deploy` |

## Функциональность (MVP)

| Модуль | Admin | Mini App | API |
|---|---|---|---|
| Статьи (TipTap, draft/published) | ✅ | ✅ | ✅ |
| Животные / категории | ✅ | ✅ | ✅ |
| Врачи + расписание | ✅ | ✅ | ✅ |
| Груминг | ✅ | ✅ | ✅ |
| О клинике (лого, баннер) | ✅ | ✅ | ✅ |
| Безопасность admin API | ✅ в `work-tech` | — | RequireRole, clinic_id, CORS whitelist, rate limit login |
| Запись на приём | ❌ | ❌ | ❌ |
| Аналитика | ❌ | ❌ | ❌ |

## Фаза roadmap

**Фаза 3 — Готовность к запуску** (в работе):

- [ ] PRD-01: скрыть груминг в Mini App, если пусто
- [ ] SEC-07: Telegram initData
- [ ] INF-01: CI quality gate на PR
- [x] Документация синхронизирована (2026-05-30)
- [x] Security hardening admin API (код в `work-tech`, ждёт деплоя)

## Тесты и CI

| Область | Статус |
|---|---|
| Go unit tests | 2 файла: `auth_test.go`, `role_test.go` |
| Frontend tests | Нет |
| CI на PR (lint/test/build) | Нет (INF-01) |
| CI deploy | ✅ Path-based на push в `dev` |

## Документация

| Артефакт | Статус |
|---|---|
| Markdown `docs/` | Актуально после hardening |
| HTML-портал | Синхронизирован, кнопки «назад» на sub-страницах |
| `docs/context/` | Обновлён для новой сессии |
