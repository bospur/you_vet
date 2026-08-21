# Текущий статус проекта

> Последнее обновление: 2026-08-21 (домен + портал)

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ | @VPract_bot |
| Mini App | 🟡 | https://app.bospur.ru · C1 smoke |
| Admin | 🟡 | https://admin.bospur.ru |
| API | ✅ | https://api.bospur.ru · nginx HTTPS |
| Docs portal | 🟡 | https://docs.bospur.ru · обновить push `dev` |
| **Mobile Android** | 🟡 | APK; API URL новый — пересборка |
| **Mobile iOS** | ⏸ | `ios/` есть; ждёт Xcode |

VPS `213.176.65.71`. nginx слушает 80/443. x-ui выключен.

## Функциональность (MVP)

| Модуль | Admin | Mini App | API / бот | Mobile |
|---|---|---|---|---|
| B1–B4 запись | 🟡 | 🟡 | 🟡 | — |
| C1 запись UI | — | 🟡 | 🟡 | — |
| Вопросы | — | 🟡 | 🟡 | 🟡 |
| Контент read-only | — | ✅ | ✅ | ✅ |
| **Mobile RuStore** | 🟡 | — | 🟡 M0–M2 | 🟡 auth+контент+ЛК; M3 backlog |

## Фокус

1. Push документации и фронтов на новый API
2. **Mobile sprint 5** — booking в APK
3. C1 smoke Mini App · BotFather / VK на `app.bospur.ru`
4. iOS — после Xcode

## CI

`ci.yml`: Go test + lint/build admin/app/mobile. Деплой: push `dev`.
