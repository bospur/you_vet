# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-08-30 (PWA: сплэш, иконки, «Ещё»/VK, email OTP)

Ветка: **`work-web`**. `origin/dev` = merge PR **#91** (`664b8ae`, в т.ч. `495e9dd` SMTP-заготовка).  
Локально **не закоммичено**: `apps/server/internal/mailer/smtp.go` (таймаут 12с + SSL **465** + AUTH LOGIN), `apps/web/src/api/auth.ts` (timeout 20с), `apps/server/.env.example`.

Агент **не** SSH на VPS. Превью Vite **не** поднимать без просьбы.

### Prod (web.bospur.ru)

- Сплэш убран → классический прелоадер. PWA после деплоя: закрыть все вкладки / ярлык.
- Иконки: Capacitor-заглушки → кот клиники (`favicon.png`, `pwa-192/512`, `apple-touch-icon`). Favicon **квадратный файл**, не `logo_url` из админки (узкий 34×72 растягивал кота).
- Раздел **«Ещё»** снят; выход — в профиле.
- **VK на вебе снят** (серверный `POST /auth/vk` для mobile оставлен).
- Вход: Telegram (номер + бот) + **email OTP** + WhatsApp (кнопка только при Green-API).
- Миграция **029** (`email` на `mobile_users`, `channel`/`login` на `auth_codes`).

### Email OTP — блокер

Исходящие **465 и 587** с VPS `213.176.65.71` **закрыты сетью Aeza** (не ufw: inactive, OUTPUT ACCEPT). POST `/api/mobile/v1/auth/request` `{channel:email}` зависает → в UI «нет связи с сервером».

- В `.env` на VPS уже SMTP Mail.ru (`vetpraktika@mail.ru`); пароль — **пароль приложения**, не заглушка `пароль_приложения`.
- Пользователь **отправил заявку в Aeza** открыть исходящие TCP 465/587 на `smtp.mail.ru`.
- После открытия: дождаться деплоя фикса mailer (сейчас только локально) → `SMTP_PORT=465` → `docker compose up -d --force-recreate app`.
- Если Aeza откажет — не SMTP, а HTTP API (Unisender/Resend и т.п.) на 443.

`GET /api/mobile/v1/auth/options` → `email: true, telegram: true, whatsapp: false` (SMTP env есть, Green-API нет).

`docker compose pull` с VPS без логина GHCR → `denied`. Новый образ только через CI (`deploy-server`) или `docker login ghcr.io`.

### Десктоп Figma (личное, не MIURA.ONE)

[Ветпрактика — десктоп PWA](https://www.figma.com/design/sMWwSXhSPFammPut7NqIcN) · `sMWwSXhSPFammPut7NqIcN`. Кадры A (`1:2`) / B (`1:3`). Вёрстка TopBar+hero уже в коде; выбор A/B формально не закрыт.

### Не делать с агента без явной просьбы

- SSH / команды на VPS.
- Коммитить / push / поднимать `vite preview`.
- Макеты в Figma MIURA.ONE.

### Следующий шаг

1. Ответ Aeza по SMTP → порт 465 + задеплоить локальный `mailer/smtp.go`.
2. Закоммитить uncommitted SMTP-фикс, влить в `dev`.
3. Booking (C1) в PWA; C1 smoke Mini App.

### Ссылки

- PWA: https://web.bospur.ru
- [deployment.md](../md/general/deployment.md) (SMTP / Green-API в таблице `.env`)

---

## Ранее 2026-08-29 (PWA в prod)

Первый выкат `web.bospur.ru`. Телефон + VPN hairpin на тот же VPS. Десктоп без сайдбара.
