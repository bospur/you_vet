# Текущий статус проекта

> Последнее обновление: 2026-08-30 (пилот PWA в коде на `work-web`)

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ | @VPract_bot |
| Mini App | 🟡 | https://app.bospur.ru · C1 smoke |
| Admin | 🟡 | https://admin.bospur.ru · персонал PWA ещё не в prod |
| API | ✅ | https://api.bospur.ru · CORS включает `web.bospur.ru` |
| Docs portal | 🟡 | https://docs.bospur.ru |
| **Web / PWA** | ✅ | https://web.bospur.ru · пилот (роли/C1/груминг/чаты) **только в коде** |
| **Mobile Android** | ⏸ | **frozen** |
| **Mobile iOS** | ⏸ | **frozen** |

VPS `213.176.65.71`. nginx 80/443. x-ui выключен.

## Функциональность (MVP)

| Модуль | Admin | Mini App | API / бот | Web PWA |
|---|---|---|---|---|
| B1–B4 запись | 🟡 | 🟡 | 🟡 | — |
| C1 запись UI | — | 🟡 | 🟡 | 🟡 **в коде** `work-web`, не prod |
| Груминг-запись клиента | admin only (prod) | read-only | 🟡 **в коде** | 🟡 **в коде** |
| Вопросы / чат | TG-группа | 🟡 вопрос | 🟡 | 🟡 чаты **в коде**; `/question` fallback |
| Контент read-only | — | ✅ | ✅ | ✅ |
| Capacitor / RuStore | — | — | — | **frozen** |

## Фокус

1. Влить `work-web` → `dev` → deploy server+web+admin; миграции **030–032**
2. Aeza: исходящие 465/587 → email OTP
3. Smoke пилота на prod; C1 smoke Mini App · ADM-02

## CI

`ci.yml` + `deploy-web.yml` (push `dev` → `/var/www/you-vet-web`). Husky lint-staged на commit.
