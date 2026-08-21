# Локальная разработка

## Требования

- Go 1.25+
- Node.js 22+, npm
- Docker + Docker Compose
- PostgreSQL (или запустить через Docker)

## Структура монорепо

```
apps/server/   — Go бэкенд
apps/admin/    — Веб-панель (порт 5173)
apps/app/      — Telegram Mini App (порт 5174)
packages/types/ — Общие TypeScript типы
```

## Запуск бэкенда

```bash
cd apps/server

# Зависимости
go mod download

# Переменные окружения
cp .env.example .env.local
# Заполни DATABASE_URL, TELEGRAM_BOT_TOKEN, CLINIC_SLUG, JWT_SECRET

# Запуск через Docker
docker compose up -d

# Или напрямую (нужна локальная PostgreSQL)
go run main.go
```

## Запуск админ-панели

```bash
cd apps/admin
npm install
cp .env.example .env.local
# VITE_API_URL=http://localhost:8080
# VITE_CLINIC_SLUG=default
npm run dev   # localhost:5173
```

## Запуск Telegram Mini App

```bash
cd apps/app
npm install
cp .env.example .env.local
# VITE_API_URL=http://localhost:8080
# VITE_CLINIC_SLUG=default
npm run dev   # localhost:5174
```

> Telegram Mini App требует HTTPS для тестирования в Telegram — используй ngrok или аналог.

---

## Git workflow

```
dev           ← основная ветка, только через PR
feature/...   fix/...   chore/...
```

### Pre-commit

На `git commit` husky запускает **lint-staged**: ESLint только по staged `.ts`/`.tsx` в `apps/docs`, `admin`, `app`, `mobile` (то же правило, что валит CI — в том числе `react-refresh/only-export-components`).

После `npm install` в корне крючок ставится сам (`prepare`: husky). Обойти: `git commit --no-verify` — только если уверены.

Go (`apps/server`) в хуке не гоняется; его ловит CI.

### Типичный флоу

```bash
# 1. Обновить dev
git checkout dev && git pull

# 2. Создать ветку
git checkout -b feature/my-feature

# 3. Разработка и коммиты
git add apps/admin/src/...
git commit -m "feat: описание изменения"

# 4. Открыть PR в GitHub: base = dev
git push --set-upstream origin feature/my-feature
```

**Никогда** не пушить напрямую в `dev`.

## Conventional Commits

| Префикс | Когда |
|---|---|
| `feat:` | Новая функциональность |
| `fix:` | Исправление бага |
| `chore:` | Зависимости, конфиги, рутина |
| `docs:` | Только документация |
| `refactor:` | Без изменения поведения |

## Turborepo

```bash
# Из корня монорепо:
npm run dev    # запустить все apps параллельно
npm run build  # собрать все apps
npm run lint   # линтинг всего
```

## Добавление нового модуля в admin (чеклист)

1. Shared типы (если нужны в app тоже) → `packages/types/src/<module>.ts` + реэкспорт в `packages/types/src/index.ts`
2. Типы модуля (FormValues, UI-специфичное) → `apps/admin/src/modules/<module>/domain/types.ts`
3. API → `apps/admin/src/data/source/<module>.ts`
4. Таблица/список → `apps/admin/src/modules/<module>/features/<Module>Table/`
5. Экран → `apps/admin/src/screens/<Module>Screen/`
6. Роут → `apps/admin/src/App.tsx` (lazy import)
7. Навигация → `NAV_ITEMS` в `apps/admin/src/shared/ui/Layout/index.tsx`

## Мобильная адаптация (паттерн для admin)

```tsx
const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

if (isMobile) {
  return <Box>{data.map(item => <Paper key={item.id} sx={{ p: 2 }}>...</Paper>)}</Box>;
}

return (
  <Paper variant="outlined">
    <TableContainer><Table size="small">...</Table></TableContainer>
  </Paper>
);
```
