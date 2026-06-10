# Текущий статус проекта

> Последнее обновление: 2026-06-10 (передача)

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ | OTP, вопросы, заявки |
| Mini App | 🟡 | C1 + вопросы |
| Admin | 🟡 | **Приложение**: список + **удаление** user — deploy |
| API | 🟡 | mobile delete user, profile 401 — deploy server |
| **Mobile app** | 🟡 | UX polish ✅ в коде · **запись** — sprint 5 |
| Docs portal | 🟡 | sync после push `dev` |

## Функциональность (MVP)

| Модуль | Admin | Mini App | API / бот | Mobile |
|---|---|---|---|---|
| B1–B4 запись | 🟡 | 🟡 | 🟡 | — |
| C1 запись UI | — | 🟡 | 🟡 | — |
| Вопросы | — | 🟡 | 🟡 | 🟡 (auth, ответ в TG) |
| Контент read-only | — | ✅ | ✅ | ✅ |
| **Mobile RuStore** | 🟡 users + delete | — | 🟡 M0–M2 | 🟡 auth+контент+ЛК+UX |

## Фокус

1. Deploy **server + admin** (delete mobile user)
2. **Mobile sprint 5** — booking в APK
3. Smoke гостевой режим + session expiry после delete в admin

## CI

`ci.yml`: Go test + lint/build admin/app/mobile.
