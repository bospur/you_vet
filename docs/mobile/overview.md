# Мобильное приложение — обзор

> Статус: исследование и проектирование · Обновлено: 2026-05-30

Отдельное **native mobile app** для iOS и Android. **Не связано с Telegram Mini App** — отдельный клиент, общий Go API и PostgreSQL.

| Документ | Содержание |
|---|---|
| [research.md](./research.md) | Аналитика: варианты, auth, сторы, риски |
| [roadmap.md](./roadmap.md) | План реализации на Capacitor, фазы, монорепо |

HTML-портал: [mobile.html](../mobile.html)

## Решение

- **Фреймворк:** [Capacitor](https://capacitorjs.com) — React + WebView + native plugins
- **Backend:** новый префикс `/api/mobile/v1/...`, без `initData`
- **Auth:** телефон + OTP в Telegram (основной), SMS — fallback позже
- **Репозиторий:** монорепо `apps/mobile/` (см. [roadmap.md](./roadmap.md))

## Каналы продукта

```
Go API + PostgreSQL
       ├── Mini App (Telegram)     — initData
       ├── Telegram Bot            — bot API
       ├── Admin                   — JWT
       └── Mobile App (Capacitor)  — mobile JWT
```
