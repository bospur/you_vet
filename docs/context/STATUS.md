# Текущий статус проекта

> Последнее обновление: 2026-08-21 (передача, канбан 026)

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ | @VPract_bot |
| Mini App | 🟡 | https://app.bospur.ru · C1 smoke |
| Admin | 🟡 | https://admin.bospur.ru |
| API | ✅ | https://api.bospur.ru · nginx HTTPS |
| Docs portal | 🟡 | https://docs.bospur.ru · ветка `work-doc-portal`; канбан 026 после merge в `dev` |
| **Mobile Android** | 🟡 | пересборка APK на новый API |
| **Mobile iOS** | ⏸ | `ios/` есть; ждёт Xcode |

VPS `213.176.65.71`. nginx 80/443. x-ui выключен.

## Функциональность (MVP)

| Модуль | Admin | Mini App | API / бот | Mobile |
|---|---|---|---|---|
| B1–B4 запись | 🟡 | 🟡 | 🟡 | — |
| C1 запись UI | — | 🟡 | 🟡 | — |
| Вопросы | — | 🟡 | 🟡 | 🟡 |
| Контент read-only | — | ✅ | ✅ | ✅ |
| **Mobile RuStore** | 🟡 | — | 🟡 M0–M2 | 🟡 auth+контент+ЛК; M3 backlog |

## Фокус

1. Merge `work-doc-portal` → `dev` (docs + server: **025+026**, теги/сиды)
2. **Mobile sprint 5** — booking в APK
3. BotFather / VK на `app.bospur.ru` · пересборка APK
4. C1 smoke · ADM-02 · iOS после Xcode

## CI

`ci.yml`: Go test + lint/build. Локально: husky **lint-staged** на commit.
