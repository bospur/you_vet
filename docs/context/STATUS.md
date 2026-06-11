# Текущий статус проекта

> Последнее обновление: 2026-06-10 (передача)

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ | OTP, вопросы, заявки |
| Mini App | 🟡 | C1 + вопросы |
| Admin | 🟡 | PNG-логотип, баннер — deploy |
| API | 🟡 | VK display name — deploy server |
| **Mobile Android** | 🟡 | polish + баннер + врачи — deploy APK; **запись** sprint 5 |
| **Mobile iOS** | ⏸ | `ios/` в репо; **ждёт Xcode** (Apple регистрация) |
| Docs portal | 🟡 | sync после push `dev` |

## Функциональность (MVP)

| Модуль | Admin | Mini App | API / бот | Mobile |
|---|---|---|---|---|
| B1–B4 запись | 🟡 | 🟡 | 🟡 | — |
| C1 запись UI | — | 🟡 | 🟡 | — |
| Вопросы | — | 🟡 | 🟡 | 🟡 (auth, ответ в TG) |
| Контент read-only | — | ✅ | ✅ | ✅ |
| **Mobile RuStore** | 🟡 | — | 🟡 M0–M2 | 🟡 auth+контент+ЛК+UX+баннер |

## Фокус

1. **Mobile sprint 5** — booking в APK
2. Deploy **server + admin + mobile** (polish этой сессии)
3. iOS — после установки Xcode: `cap sync ios` → симулятор

## CI

`ci.yml`: Go test + lint/build admin/app/mobile.
