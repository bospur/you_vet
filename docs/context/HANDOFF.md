# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-08-29 (PWA `apps/web` → web.bospur.ru)

Ветка: текущая рабочая (не коммитили, пока пользователь не попросил).

Смена плана: **сторы Android/iOS frozen**. Клиент вне Telegram — веб и PWA, пакет **`apps/web`** (`@you-vet/web`). `apps/mobile` (Capacitor) не трогаем как канал публикации.

Mini App на `app.bospur.ru` без изменений.

### Сделано

- Новый SPA `apps/web`: копия клиентского UI без Capacitor; PWA (`vite-plugin-pwa`), баннер установки, десктоп-сайдбар ≥900px, сетки.
- API CORS: `https://web.bospur.ru` + `localhost:5177`.
- CI: `deploy-web.yml` (push `dev` → `/var/www/you-vet-web`), `ci.yml` собирает `@you-vet/web`.
- Nginx **не** в `apps/server/nginx/` — сниппет для VPS в [deployment.md](../md/general/deployment.md).

### Prod ещё нет

Нужны: DNS `web.bospur.ru`, nginx+cert на VPS, `CORS_ORIGINS` если задан в `.env`, GitHub Secret `VITE_VK_APP_ID`, кабинет VK (origin + `/auth/vk-callback`), merge/push `dev`.

### Не делать с агента без явной просьбы

- SSH / команды на VPS.
- Коммитить / push.
- Оживлять RuStore / cap sync.

### Следующий шаг

1. На VPS: DNS, каталог `/var/www/you-vet-web`, nginx из deployment.md, certbot.
2. Push `dev` → `deploy-web` + `deploy-server` (CORS).
3. Проверить https://web.bospur.ru (телефон, десктоп, «установить»).
4. Дальше по продукту: booking (C1) уже в вебе, не в APK.

### Ссылки

- PWA: https://web.bospur.ru (после выкладки)
- Портал: https://docs.bospur.ru · `/mobile` · `/board?task=<id>`
- [deployment.md](../md/general/deployment.md) · [overview.md](../md/mobile/overview.md)

---

## Сессия 2026-08-21 вечер (канбан: ссылка на задачу `?task=`)

Ветка: **`work-doc-portal`**. Канбан `?task=` — в коде `37d5c7b`; в `dev`/prod после merge.

Следующий шаг тогда: merge `work-doc-portal` → `dev` (`deploy-docs` + `deploy-server` **025+026**).
