# YouVet — документация

SaaS-платформа для ветеринарных клиник. Telegram Mini App + веб-панель + Go API.

## Структура

```
docs/
├── CODEWORDS.md      # кодовые слова AI: контекст · портал · передача
├── README.md         # этот файл
├── context/          # память между AI-сессиями (handoff)
├── md/               # markdown для разработчиков и AI (не деплоится)
│   ├── general/      # архитектура, деплой, роли, аудит…
│   ├── server/       # Go API, бот
│   ├── admin/        # веб-панель
│   ├── app/          # Mini App
│   ├── mobile/       # нативное приложение (planned)
│   ├── phases/       # фазы продукта (запись и т.д.)
│   ├── adr/          # architecture decision records
│   └── frontend/     # шаблоны модулей admin
└── html/             # портал для команды и клиники → docs.snz…
```

| Каталог | Кто читает | Деплой на VPS |
|---------|------------|---------------|
| `context/` | AI, вы | нет |
| `md/` | разработчики, AI | нет |
| `html/` | команда, клиника | да (`deploy-docs.yml`) |

Полный индекс markdown: [md/README.md](./md/README.md)  
Кодовые слова: [CODEWORDS.md](./CODEWORDS.md)

## HTML-портал

> https://docs.snzbeachvolleyball25.ru · обновление: **`портал`** (+ маршрут)

| Страница | Аудитория |
|----------|-----------|
| [html/index.html](./html/index.html) | Навигация |
| [html/project-for-devs.html](./html/project-for-devs.html) | Разработчики |
| [html/roadmap.html](./html/roadmap.html) | Roadmap |
| [html/booking-for-clinic.html](./html/booking-for-clinic.html) | **Клиника** — запись |
| [html/phase-5-appointments.html](./html/phase-5-appointments.html) | Фаза 5 (тех.) |
| [html/design-brief.html](./html/design-brief.html) | Дизайнеры |
| [html/audit.html](./html/audit.html) | Аудит |
| [html/mobile.html](./html/mobile.html) | Mobile (planned) |

## Быстрый старт (разработка)

```bash
git clone https://github.com/Bospur/you_vet.git
cd you_vet
npm install
npm run dev
```

Подробнее → [md/general/development.md](./md/general/development.md)
