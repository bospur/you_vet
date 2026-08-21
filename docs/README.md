# YouVet — документация

SaaS для ветклиник: Telegram Mini App + admin + Go API + бот + mobile «Ветпрактика».

## Структура

```
docs/
├── CODEWORDS.md      # контекст · портал · передача
├── context/          # память AI (на сайт не попадает)
├── md/               # markdown; часть страниц портала импортируется изсюда
│   ├── portal/       # продажи, roadmap, памятка клиники
│   ├── general/      # архитектура, деплой, роли…
│   ├── server/ admin/ app/ mobile/ phases/
└── html/             # legacy, не деплоится
```

Сайт: **https://docs.bospur.ru** — React `apps/docs`, CI `deploy-docs.yml`.

| Каталог | Кто читает | На docs.bospur.ru? |
|---------|------------|---------------------|
| `context/` | AI | нет |
| `md/` | разработчики, AI | да, если файл в `apps/docs/src/pages.ts` |
| `html/` | — | нет |

Индекс md: [md/README.md](./md/README.md) · кодовые слова: [CODEWORDS.md](./CODEWORDS.md)

## Страницы портала

| URL | Аудитория |
|-----|-----------|
| [/sales](https://docs.bospur.ru/sales) | продажи |
| [/project-for-devs](https://docs.bospur.ru/project-for-devs) | разработка |
| [/roadmap](https://docs.bospur.ru/roadmap) | команда |
| [/rustore-app](https://docs.bospur.ru/rustore-app) · [/mobile](https://docs.bospur.ru/mobile) | mobile |
| [/booking-for-clinic](https://docs.bospur.ru/booking-for-clinic) | клиника |
| [/phase-5-appointments](https://docs.bospur.ru/phase-5-appointments) | запись (техплан) |
| [/board](https://docs.bospur.ru/board) | канбан |

Обновление: кодовое слово **`портал`**.
