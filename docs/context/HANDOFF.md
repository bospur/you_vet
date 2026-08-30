# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-08-30 (пилот PWA: роли, C1, груминг, чаты)

Ветка: **`work-web`**. Последний коммит: **`13ffcdb`** `wip(web): Роли + чат`.  
Рабочее дерево чистое. В **`origin/dev` ещё не влито** — prod без пилота.

SMTP-фикс mailer уже в git: **`495e9dd`** (`wip(web): пожключение смтп для атворизации`).

Агент **не** SSH на VPS. Превью Vite **не** поднимать без просьбы.

### Что сделано в коде (не в prod)

Одна OTP-авторизация, разные оболочки по `mobile_users.app_role`: `client` | `doctor` | `groomer` | `chief_vet`.

- Admin → Обзор → «Приложение»: пригласить персонал (телефон/email + роль), сменить роль. После смены — **выйти и войти** (JWT `app_role`).
- **C1 в PWA:** услуга → дата/слот → форма → «Мои заявки». Врач/главврач: `/staff/booking` confirm/reject.
- **Груминг:** клиент `/grooming/book` (слот, `pending`); грумер/главврач `/staff/grooming` (лента на дату).
- **Чаты:** общий (`clinic_wall`) + тред с врачом (`consult`). Лимиты 10 / 15 сообщений в сутки; 1 открытый тред. Polling 8–10 с. Consult → бот в `staff_chat_id` / личка клиенту.
- Старый `/question` оставлен (ответ в Telegram).

Миграции **ещё не на VPS:** `030` app_role, `031` grooming `mobile_user_id`+`status`, `032` chat_*.

### Email OTP — блокер (без изменений)

Исходящие **465 и 587** с VPS закрыты сетью Aeza. Заявка в поддержку уже отправлена.  
После открытия: deploy server (`495e9dd`+пилот) → `SMTP_PORT=465` → `docker compose up -d --force-recreate app` (только пользователь).  
Если Aeza откажет — HTTP API на 443, не SMTP.

### Не делать с агента без явной просьбы

- SSH / команды на VPS.
- Коммитить / push / поднимать `vite preview`.
- Макеты в Figma MIURA.ONE.

### Следующий шаг

1. Push `work-web` → PR в `dev` (или влить) → CI: **server + web + admin**. Миграции 030–032 на deploy-server.
2. В admin выдать роли пилотным врачу/грумеру; они логинятся OTP заново.
3. Ответ Aeza → email OTP в prod.
4. Smoke: клиент запись + груминг + чат; врач inbox; грумер день.

### Ссылки

- PWA: https://web.bospur.ru
- План: `.cursor/plans/pwa_pilot_scope_4c330b5e.plan.md`
- [deployment.md](../md/general/deployment.md)

---

## Ранее 2026-08-30 (PWA: сплэш, иконки, VK снят, email OTP)

Сплэш убран, иконки кота, «Ещё» снят, VK на вебе снят. Миграция **029** в prod. SMTP с VPS закрыт Aeza.

---

## Ранее 2026-08-29 (PWA в prod)

Первый выкат `web.bospur.ru`.
