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
└── types/    — @you-vet/types — общие TypeScript типы (admin + app)
```

## Стек

| Слой | Технологии |
|---|---|
| Backend | Go 1.25, PostgreSQL 16, Docker |
| Admin | Vite + React 19 + MUI v7 + TanStack Query + TipTap |
| Mini App | Vite + React 18 + @telegram-apps/telegram-ui + TanStack Query |
| Infra | VPS Ubuntu, Nginx, Let's Encrypt, GitHub Actions |
| Monorepo | Turborepo, npm workspaces |

## Быстрый старт

```bash
git clone https://github.com/bospur/you_vet.git
cd you_vet
npm install

# Бэкенд
cp apps/server/.env.example apps/server/.env  # заполнить переменные
cd apps/server && docker compose up -d

# Фронтенд (из корня)
npm run dev   # запускает admin и app параллельно
```

## Документация

| Документ | Описание |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Системная архитектура и схема взаимодействия |
| [docs/api.md](docs/api.md) | Полный справочник API |
| [docs/development.md](docs/development.md) | Локальная разработка и git workflow |
| [docs/deployment.md](docs/deployment.md) | Деплой и инфраструктура |
| [docs/roles.md](docs/roles.md) | Ролевая модель и права доступа |
| [docs/data-model.md](docs/data-model.md) | Схема базы данных |
| [docs/monorepo.md](docs/monorepo.md) | Устройство монорепо |

## Git workflow

```
dev           ← основная ветка, только через PR (деплоит CI/CD)
feature/...   fix/...   chore/...
```

Никогда не пушить напрямую в `dev` — только через PR.
