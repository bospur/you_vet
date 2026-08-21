# Markdown-документация

Источник правды для разработчиков и AI. На **портал** попадает только то, что подключено в `apps/docs/src/pages.ts` (после push `dev`).  
`docs/html/` — legacy, не деплоится. `docs/context/` — только для AI.

## Портал (`md/portal/` + страницы из других папок)

| На сайте | Файл | Для кого |
|----------|------|----------|
| [/](https://docs.bospur.ru/) | карточки в `HomePage.tsx` | все |
| [/sales](https://docs.bospur.ru/sales) | [portal/sales.md](./portal/sales.md) | продажи |
| [/project-for-devs](https://docs.bospur.ru/project-for-devs) | [general/architecture.md](./general/architecture.md) | команда |
| [/roadmap](https://docs.bospur.ru/roadmap) | [portal/roadmap.md](./portal/roadmap.md) | команда |
| [/rustore-app](https://docs.bospur.ru/rustore-app) | [mobile/rustore-guide.md](./mobile/rustore-guide.md) | команда |
| [/mobile](https://docs.bospur.ru/mobile) | [mobile/overview.md](./mobile/overview.md) | команда |
| [/booking-for-clinic](https://docs.bospur.ru/booking-for-clinic) | [portal/booking-for-clinic.md](./portal/booking-for-clinic.md) | клиника |
| [/phase-5-appointments](https://docs.bospur.ru/phase-5-appointments) | [phases/phase-5-appointments.md](./phases/phase-5-appointments.md) | клиника / dev |

## Общее (`md/general/`)

| Документ | Описание |
|----------|----------|
| [architecture.md](./general/architecture.md) | Схема системы, CI/CD |
| [data-model.md](./general/data-model.md) | Схема БД |
| [roles.md](./general/roles.md) | Роли |
| [deployment.md](./general/deployment.md) | VPS, домены `*.bospur.ru`, env |
| [development.md](./general/development.md) | Локальная разработка |
| [monorepo.md](./general/monorepo.md) | Turborepo |
| [audit.md](./general/audit.md) | Аудит |
| [design-brief.md](./general/design-brief.md) | Бриф для дизайна |
| [docs-portal-restore.md](./general/docs-portal-restore.md) | Починка nginx/certs docs |

## Фазы · сервер · admin · Mini App · mobile

См. те же файлы, что раньше: [phases/](./phases/), [server/](./server/), [admin/](./admin/), [app/](./app/), [mobile/](./mobile/).

Кодовые слова: [../CODEWORDS.md](../CODEWORDS.md). Память AI: [../context/](../context/).
