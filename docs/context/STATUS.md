# Текущий статус проекта

> Последнее обновление: 2026-06-10 (передача)

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | 🟡 | OTP + `/start link`; contact-кнопка — после merge `dev` |
| Mini App | 🟡 | C1 + вопросы |
| Admin | ✅ | без изменений в mobile-сессии |
| API | 🟡 | **019** prod; **020 + /auth/vk** + фикс VK `user_info` — в коде, deploy |
| **Mobile app** | 🟡 | TG auth ✅ на APK; VK до redirect; профиль в «Ещё»; RuStore — нет |
| Docs portal | 🟡 | phase-5 + clinic — mobile канал (после push `dev`) |
| VPS | 🟡 | `VK_APP_*` — проверить новый ID после пересоздания приложения VK |

## Функциональность (MVP)

| Модуль | Admin | Mini App | API / бот | Mobile |
|---|---|---|---|---|
| B1–B4 запись | 🟡 | 🟡 | 🟡 | — |
| C1 запись UI | — | 🟡 | 🟡 | — |
| Вопросы клиенту | — | 🟡 | 🟡 | v1.1 |
| **Mobile RuStore** | — | — | 🟡 M0+auth | 🟡 M1+auth UI, TG ✅ |

## Фокус

1. **Deploy server** — VK `user_info` (`client_id`), миграция 020
2. Smoke **VK login** на APK после deploy
3. Deploy **app** — `vk-callback.html` на prod
4. Mobile sprint 2 (статьи) · sprint 5 (booking)

## CI

`ci.yml`: Go test + lint/build admin/app/mobile.
