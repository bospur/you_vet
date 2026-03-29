# Локальная разработка

## Требования

- Go 1.21+
- Node.js 20+, npm 10+
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
# VITE_API_URL=http://localhost:8080  (или прод URL для работы с прод-данными)
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
Bospur (prod) ← PR-only  ← релизы
dev           ← PR-only  ← интеграционная
feature/...   fix/...   chore/...
```

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

**Никогда** не пушить напрямую в `dev` или `Bospur`.

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

1. Типы → `apps/admin/src/modules/<module>/domain/types.ts`
2. API → `apps/admin/src/data/source/<module>.ts`
3. Таблица/список → `apps/admin/src/modules/<module>/features/<Module>Table/`
4. Экран → `apps/admin/src/screens/<Module>Screen/`
5. Роут → `apps/admin/src/App.tsx` (lazy import)
6. Навигация → `NAV_ITEMS` в `apps/admin/src/shared/ui/Layout/index.tsx`

Общие типы (если нужны в app тоже) → `packages/types/src/`

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
