# Текущий статус проекта

> Последнее обновление: 2026-06-09 (передача)

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | 🟡 | C1+вопросы — deploy; + mobile link/contact/OTP — **после push этой сессии** |
| Mini App | 🟡 | C1 + вопросы — deploy app (если не выкатано) |
| Admin | ✅ / 🟡 | без изменений в mobile-сессии |
| API | 🟡 | 016–017 + **019 mobile** — deploy server |
| **Mobile app** | 🟡 | M0+M1 sprint1 **в коде**, не в RuStore |
| Docs portal | ✅ | восстановлен 2026-06-09 на VPS `213.176.65.71` |
| VPS | 🟡 | новый хост; проверить `VPS_HOST` в GitHub Secrets |

## Функциональность (MVP)

| Модуль | Admin | Mini App | API / бот | Mobile |
|---|---|---|---|---|
| B1–B4 запись | 🟡 | 🟡 | 🟡 | — |
| C1 запись UI | — | 🟡 | 🟡 | — |
| Вопросы клиенту | — | 🟡 | 🟡 | v1.1 |
| **Mobile RuStore** | — | — | 🟡 M0 код | 🟡 M1 shell |

## Фокус

1. Push `dev` → deploy **server** (миграция **019**)
2. Smoke mobile auth (бот link → OTP → JWT → booking API)
3. Mobile sprints 2–5 (`screen-specs.md`)
4. Backlog: C1 smoke, ADM-02

## CI

`ci.yml`: Go test + lint/build admin/app/**mobile**.
