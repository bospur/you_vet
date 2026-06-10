# Текущий статус проекта

> Последнее обновление: 2026-06-10 (передача)

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | 🟡 | Фикс кнопки contact — в `work-mobile`, после merge `dev` |
| Mini App | 🟡 | C1 + вопросы |
| Admin | ✅ | без изменений в mobile-сессии |
| API | 🟡 | M0 **019** на prod; **020 + /auth/vk** — в `work-mobile`, merge → `dev` |
| **Mobile app** | 🟡 | Auth UI + VK в `work-mobile`; debug APK на телефоне; RuStore — нет |
| Docs portal | ✅ | rustore + roadmap обновлены |
| VPS | 🟡 | `VK_APP_*` в `.env`; deploy через CI после merge |

## Функциональность (MVP)

| Модуль | Admin | Mini App | API / бот | Mobile |
|---|---|---|---|---|
| B1–B4 запись | 🟡 | 🟡 | 🟡 | — |
| C1 запись UI | — | 🟡 | 🟡 | — |
| Вопросы клиенту | — | 🟡 | 🟡 | v1.1 |
| **Mobile RuStore** | — | — | 🟡 M0+VK в коде | 🟡 M1+auth UI |

## Фокус

1. Merge **`work-mobile` → `dev`** → Deploy server (020, VK, бот)
2. `VITE_VK_APP_ID` (число) + `npm run build` → `cap sync` → новый APK
3. Smoke VK login на телефоне
4. Sprint 2 — статьи в mobile

## CI

`ci.yml`: Go test + lint/build admin/app/**mobile**.
