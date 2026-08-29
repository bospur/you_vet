# Текущий статус проекта

> Последнее обновление: 2026-08-29 вечер (PWA prod, макеты десктопа)

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ | @VPract_bot |
| Mini App | 🟡 | https://app.bospur.ru · C1 smoke |
| Admin | 🟡 | https://admin.bospur.ru |
| API | ✅ | https://api.bospur.ru · CORS включает `web.bospur.ru` |
| Docs portal | 🟡 | https://docs.bospur.ru |
| **Web / PWA** | ✅ | https://web.bospur.ru · десктоп UX 🟡 |
| **Mobile Android** | ⏸ | **frozen** |
| **Mobile iOS** | ⏸ | **frozen** |

VPS `213.176.65.71`. nginx 80/443. x-ui выключен.

## Функциональность (MVP)

| Модуль | Admin | Mini App | API / бот | Web PWA |
|---|---|---|---|---|
| B1–B4 запись | 🟡 | 🟡 | 🟡 | — |
| C1 запись UI | — | 🟡 | 🟡 | 🟡 плейсхолдер `/booking` |
| Вопросы | — | 🟡 | 🟡 | 🟡 |
| Контент read-only | — | ✅ | ✅ | ✅ |
| Capacitor / RuStore | — | — | — | **frozen** |

## Фокус

1. Десктоп `apps/web`: выбрать Figma A/B и убрать «админку»
2. VK на `web.bospur.ru`
3. Booking (C1) в PWA
4. C1 smoke Mini App · ADM-02

## CI

`ci.yml` + `deploy-web.yml` (push `dev` → `/var/www/you-vet-web`). Husky lint-staged на commit.
