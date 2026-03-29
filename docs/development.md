# Разработка

## Требования

- Node.js 20+
- npm 10+
- Доступ к бэкенду (`vp-bot-server`) или его локальный запуск

## Локальный запуск

```bash
git clone https://github.com/bospur/vp-bot-admin.git
cd vp-bot-admin
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`:
```
VITE_API_URL=https://api.snzbeachvolleyball25.ru   # прод бэкенд
# или
VITE_API_URL=http://localhost:8080                 # локальный бэкенд
```

## Ветки и процесс разработки

```
Bospur (main/prod)
    ↑ PR merge (только релизы)
   dev
    ↑ PR merge
  feature/...   fix/...   chore/...
```

### Правила
- **Никогда не пушить напрямую в `dev`** — только через PR
- Ветку создавать от `dev`, называть `feature/короткое-описание`
- Один PR — одна логическая задача
- Перед открытием PR убедиться что `npm run build` проходит без ошибок

### Типичный флоу

```bash
# 1. Обновить dev
git checkout dev && git pull

# 2. Создать ветку
git checkout -b feature/my-feature

# 3. Разработка, коммиты
git add src/...
git commit -m "feat: описание изменения"

# 4. Запушить и открыть PR
git push --set-upstream origin feature/my-feature
# Открыть PR в GitHub: base = dev
```

## Структура коммитов

Используем [Conventional Commits](https://www.conventionalcommits.org/):

| Префикс | Когда использовать |
|---------|-------------------|
| `feat:` | Новая функциональность |
| `fix:` | Исправление бага |
| `chore:` | Зависимости, конфиги, рутина |
| `docs:` | Только документация |
| `refactor:` | Рефакторинг без изменения поведения |

## Добавление нового раздела (чеклист)

1. **Типы** — `src/modules/<module>/domain/types.ts`
2. **API** — `src/data/source/<module>.ts` (функции через `axiosInstance`)
3. **Таблица/список** — `src/modules/<module>/features/<Module>Table/index.tsx`
   - Десктоп: `<Table>` + `<Paper variant="outlined">`
   - Мобиле: карточки `<Paper>` через `isMobile = useMediaQuery(...breakpoints.down('sm'))`
4. **Экран списка** — `src/screens/<Module>Screen/index.tsx`
   - Кнопка "Добавить": текст на десктопе, `IconButton` на мобиле
5. **Экран редактора** — `src/screens/<Module>EditorScreen/index.tsx`
   - Предупреждение при уходе: `useBlocker` + `beforeunload`
6. **Роут** — добавить в `src/App.tsx` (lazy import + route в массиве)
7. **Навигация** — добавить в `NAV_ITEMS` в `src/shared/ui/Layout/index.tsx`

## Мобильная адаптация

Обязательный паттерн для всех таблиц:

```tsx
const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

if (isMobile) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {data.map((item) => (
        <Paper key={item.id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* компактное представление */}
        </Paper>
      ))}
    </Box>
  );
}

return (
  <Paper variant="outlined">
    <TableContainer>
      <Table size="small">
        {/* полная таблица */}
      </Table>
    </TableContainer>
  </Paper>
);
```

## Ролевая модель в UI

```tsx
const { user } = useAuth();
const isAdmin = user?.role === 'admin';

// Скрыть кнопку публикации для редактора
{isAdmin && <Button onClick={publish}>Опубликовать</Button>}

// Условный рендер в навигации (Layout.tsx)
NAV_ITEMS.filter(({ adminOnly }) => !adminOnly || user?.role === 'admin')
```

Проверка прав также дублируется на бэкенде — фронтенд только для UX.

## Переменные окружения

| Переменная | Описание |
|---|---|
| `VITE_API_URL` | Базовый URL бэкенда. Axios добавляет этот URL как `baseURL`. |

Все переменные должны начинаться с `VITE_` чтобы Vite включил их в бандл.

## Полезные команды

```bash
npm run dev          # запуск dev-сервера (localhost:5173)
npm run build        # production сборка (проверяет TypeScript)
npm run preview      # превью production сборки
```

## Связанные репозитории

| Репозиторий | Назначение |
|-------------|-----------|
| [vp-bot-server](https://github.com/bospur/vp-bot-server) | Go бэкенд + Telegram бот |
| vp-bot-admin (этот репо) | React админ-панель |
