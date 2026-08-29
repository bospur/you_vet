# Мобильное и веб-приложение — обзор

> Статус: **PWA в коде** (`apps/web` → `web.bospur.ru`) · Capacitor / RuStore / iOS **frozen** · Обновлено: 2026-08-29  
> Не путать с Telegram Mini App. Общий Go API и PostgreSQL.

Клиентский канал вне Telegram — **сайт и PWA «Ветпрактика»**. Нативные оболочки Android/iOS в `apps/mobile` остаются в репо, сторы не публикуем (ограничения магазинов в РФ).

| | |
|---|---|
| Название | Ветпрактика |
| Веб | https://web.bospur.ru (`apps/web`) |
| API | `https://api.bospur.ru/api/mobile/v1` |
| Клиника в сборке | `VITE_CLINIC_SLUG=default` |
| Capacitor appId | `ru.snzbeachvolleyball25.vetpraktika` (не менять; frozen) |

## Документы

| Документ | Содержание |
|---|---|
| [design-mvp.md](./design-mvp.md) | MVP: scope, экраны, UI, auth (исторически под RuStore) |
| [screen-specs.md](./screen-specs.md) | Wireframes экранов |
| [app-id-and-stores.md](./app-id-and-stores.md) | appId, RuStore — **frozen** |
| [rustore-guide.md](./rustore-guide.md) | Чеклист публикации — **frozen** |
| [multi-tenant-notes.md](./multi-tenant-notes.md) | 1 клиника на сборку |
| [roadmap.md](./roadmap.md) | Исторический план Capacitor |

На портале: [тех. обзор](/mobile) · [продажи](/sales).

## Что уже есть

- Backend `/api/mobile/v1`, миграции 019–021, OTP в Telegram, VK ID.
- `apps/web`: те же экраны (splash, tabs / десктоп-сайдбар, контент, auth, ЛК, вопрос врачу).
- PWA: manifest, service worker (статика; API не кэшируется), баннер установки.
- Десктоп ≥900px: сайдбар вместо TabBar, сетки в несколько колонок.

## Каналы продукта

```
Go API + PostgreSQL
       ├── Mini App (Telegram)     — initData, app.bospur.ru
       ├── Telegram Bot            — bot API
       ├── Admin                   — cookie JWT
       ├── Web / PWA               — mobile JWT, web.bospur.ru
       └── Mobile Capacitor        — frozen
```

## Что дальше

| Этап | Статус |
|---|---|
| DNS + nginx + cert `web.bospur.ru` | вручную на VPS, затем `deploy-web` |
| VK origin/redirect для web | кабинет VK + Secret `VITE_VK_APP_ID` |
| Запись (C1) в PWA | следующий продуктовый шаг |
| RuStore / iOS | frozen |
