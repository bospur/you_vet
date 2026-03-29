# YouVet — Telegram Mini App для ветеринарных клиник

SaaS-платформа для ветклиник: владельцы питомцев получают информацию первой помощи и расписание врачей прямо в Telegram, а клиника управляет всем через веб-панель.

## Продукт

| | |
|---|---|
| **Telegram бот** | @VPract_bot |
| **Mini App** | https://app.snzbeachvolleyball25.ru |
| **Админ-панель** | https://admin.snzbeachvolleyball25.ru |
| **API** | https://api.snzbeachvolleyball25.ru |

## Приложения в монорепо

```
apps/
├── server/   — Go бэкенд + Telegram бот (PostgreSQL)
├── admin/    — Веб-панель управления клиникой (React + MUI)
└── app/      — Telegram Mini App для клиентов (React + TG UI)

packages/
└── types/    — Общие TypeScript типы (admin + app)
```

## Стек

| Слой | Технологии |
|---|---|
| Backend | Go, PostgreSQL, Docker |
| Admin | Vite + React 18 + MUI + TanStack Query + TipTap |
| Mini App | Vite + React 18 + @telegram-apps/telegram-ui + TanStack Query |
| Infra | VPS Ubuntu, Nginx, Let's Encrypt, GitHub Actions |
| Monorepo | Turborepo, npm workspaces |

## Быстрый старт

```bash
git clone https://github.com/bospur/you_vet.git
cd you_vet
npm install
```

Запуск каждого приложения — в соответствующей папке `apps/*`.

> Полный локальный запуск через единый `docker compose` — в разработке (Этап 4 миграции).

## Документация

| Документ | Описание |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Системная архитектура и схема взаимодействия |
| [docs/api.md](docs/api.md) | Полный справочник API |
| [docs/development.md](docs/development.md) | Локальная разработка и git workflow |
| [docs/deployment.md](docs/deployment.md) | Деплой и инфраструктура |
| [docs/roles.md](docs/roles.md) | Ролевая модель и права доступа |
| [docs/data-model.md](docs/data-model.md) | Схема базы данных |
| [docs/monorepo.md](docs/monorepo.md) | Устройство монорепо и статус миграции |

## Git workflow

```
Bospur (prod) ← PR-only  ← релизы
dev           ← PR-only  ← интеграционная
feature/...   fix/...   chore/...
```

Никогда не пушить напрямую в `dev` или `Bospur` — только через PR.
