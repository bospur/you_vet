# Монорепо — устройство и статус миграции

## Инструменты

- **Turborepo** — оркестрация задач (build, dev, lint)
- **npm workspaces** — связь между пакетами (`apps/*`, `packages/*`)

## Структура

```
you_vet/
├── apps/
│   ├── server/    — Go бэкенд (go.mod независимый, не входит в npm workspaces)
│   ├── admin/     — Веб-панель React
│   └── app/       — Telegram Mini App React
├── packages/
│   ├── types/     — @you-vet/types (общие TS типы)
│   └── cat/       — @you-vet/cat (CatLogo, CatPreloader)
├── turbo.json
├── package.json   — root workspaces
└── .gitignore
```

> Go (`apps/server`) управляет зависимостями через `go.mod` независимо от npm workspaces.

## Общие пакеты

### `@you-vet/types`

`packages/types` — единый источник TypeScript типов для `apps/admin` и `apps/app`.

```typescript
import type { Doctor, GroomingBreed } from '@you-vet/types';
```

Файлы: `animals.ts`, `articles.ts`, `doctors.ts`, `grooming.ts`, `users.ts`, `index.ts`

### `@you-vet/cat`

`packages/cat` — CatLogo, CatPreloader (Mini App). При изменении — вручную redeploy app или добавить path в `deploy-app.yml` (см. ISSUES INF-02).

## Статус миграции

| Этап | Статус | Описание |
|---|---|---|
| 0. Подготовка | ✅ Готово | Все PR смержены в dev во всех трёх репо |
| 1. Структура монорепо | ✅ Готово | Turborepo, package.json, turbo.json |
| 2. Перенос кода | ✅ Готово | git subtree из dev каждого репо |
| 3. packages/types | ✅ Готово | Пакет создан, tygo удалён, импорты обновлены |
| 4. Единый docker-compose | ✅ Готово | docker-compose.yml в корне монорепо |
| 5. CI/CD (path-based) | ✅ Готово | `.github/workflows/deploy-{server,admin,app,docs}.yml` |
| 5b. Legacy workflows | ⚠️ Устарели | `apps/*/.github/workflows/` — не используются, удалить |
| 6. Архивация старых репо | ❌ Не начато | После переноса секретов на GitHub |

## Turborepo команды

```bash
# Из корня монорепо
npm run dev      # turbo dev — все apps параллельно
npm run build    # turbo build — с учётом зависимостей (^build)
npm run lint     # turbo lint
```

## Старые репозитории

После завершения миграции (Этап 6) будут заархивированы:
- https://github.com/bospur/vp-bot-server
- https://github.com/bospur/vp-bot-admin
- https://github.com/bospur/vp-bot-app

## Обновление кода из старого репо (subtree pull)

Если нужно подтянуть изменения из старого репо до его архивации:

```bash
git subtree pull --prefix=apps/server server dev --squash
git subtree pull --prefix=apps/admin  admin  dev --squash
git subtree pull --prefix=apps/app    app    dev --squash
```
