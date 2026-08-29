# Текущий статус проекта

> Последнее обновление: 2026-08-29 (PWA `apps/web`, сторы frozen)

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ | @VPract_bot |
| Mini App | 🟡 | https://app.bospur.ru · C1 smoke |
| Admin | 🟡 | https://admin.bospur.ru |
| API | ✅ | https://api.bospur.ru · nginx HTTPS |
| Docs portal | 🟡 | https://docs.bospur.ru · канбан 025+026 + `?task=` после merge в `dev` |
| **Web / PWA** | 🟡 | код `apps/web`; https://web.bospur.ru после DNS+nginx+`deploy-web` |
| **Mobile Android** | ⏸ | **frozen** — сторы не публикуем |
| **Mobile iOS** | ⏸ | **frozen** |

VPS `213.176.65.71`. nginx 80/443. x-ui выключен.

## Функциональность (MVP)

| Модуль | Admin | Mini App | API / бот | Web PWA |
|---|---|---|---|---|
| B1–B4 запись | 🟡 | 🟡 | 🟡 | — |
| C1 запись UI | — | 🟡 | 🟡 | 🟡 плейсхолдер `/booking` |
| Вопросы | — | 🟡 | 🟡 | 🟡 |
| Контент read-only | — | ✅ | ✅ | ✅ в коде |
| Capacitor / RuStore | — | — | — | **frozen** |

## Фокус

1. Выкладка `web.bospur.ru` (DNS, nginx на VPS, CORS, VK, `deploy-web`)
2. Merge `work-doc-portal` → `dev` если ещё не в prod (канбан **025+026**, `?task=`)
3. Booking (C1) в PWA, не в APK
4. C1 smoke Mini App · ADM-02

## CI

`ci.yml`: Go test + lint/build (admin, app, mobile, **web**, docs). Локально: husky **lint-staged** на commit.
