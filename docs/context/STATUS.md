# Текущий статус проекта

> Последнее обновление: 2026-06-10 (передача)

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ | OTP, вопросы, заявки |
| Mini App | 🟡 | C1 + вопросы |
| Admin | 🟡 | **Обзор → Приложение** после deploy |
| API | 🟡 | **020–021** (VK, profile, mobile questions) — deploy |
| **Mobile app** | 🟡 | Auth ✅ · контент ✅ · ЛК ✅ · **запись** — sprint 5 |
| Docs portal | 🟡 | sync phase-5 после push `dev` |

## Функциональность (MVP)

| Модуль | Admin | Mini App | API / бот | Mobile |
|---|---|---|---|---|
| B1–B4 запись | 🟡 | 🟡 | 🟡 | — |
| C1 запись UI | — | 🟡 | 🟡 | — |
| Вопросы | — | 🟡 | 🟡 | 🟡 (ответ в TG) |
| Контент read-only | — | ✅ | ✅ | ✅ |
| **Mobile RuStore** | 🟡 users tab | — | 🟡 M0–M1 | 🟡 auth+контент+ЛК |

## Фокус

1. Deploy **021** + admin mobile stats (если не на prod)
2. **Mobile sprint 5** — booking в APK
3. **ADM-02** · C1 smoke

## CI

`ci.yml`: Go test + lint/build admin/app/mobile.
