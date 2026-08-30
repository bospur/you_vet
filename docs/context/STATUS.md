# Текущий статус проекта

> Последнее обновление: 2026-08-30 (email OTP, Aeza SMTP)

## Prod

| Компонент | Статус | Примечание |
|---|---|---|
| Telegram-бот | ✅ | @VPract_bot |
| Mini App | 🟡 | https://app.bospur.ru · C1 smoke |
| Admin | 🟡 | https://admin.bospur.ru |
| API | ✅ | https://api.bospur.ru · CORS включает `web.bospur.ru` |
| Docs portal | 🟡 | https://docs.bospur.ru |
| **Web / PWA** | ✅ | https://web.bospur.ru · email-вход 🔴 SMTP с VPS заблокирован |
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

1. Aeza: исходящие 465/587 на smtp.mail.ru → добить email OTP
2. Закоммитить/задеплоить фикс `mailer/smtp.go` (465 + таймаут)
3. Booking (C1) в PWA · C1 smoke Mini App · ADM-02

## CI

`ci.yml` + `deploy-web.yml` (push `dev` → `/var/www/you-vet-web`). Husky lint-staged на commit.
