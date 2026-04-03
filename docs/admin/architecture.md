# Архитектура Admin Panel

`apps/admin` — React SPA на Vite + MUI. Использует FSD-like структуру модулей.

## Структура файлов

```
src/
├── App.tsx                          — роутинг (createBrowserRouter + lazy loading)
├── main.tsx
│
├── data/source/                     — axios вызовы к API
│   ├── axiosInstance.ts             — axios с Bearer interceptor
│   ├── animals.ts
│   ├── categories.ts
│   ├── articles.ts
│   ├── clinic_info.ts               — getClinicInfo, updateClinicInfo, uploadLogo/Banner
│   ├── doctors.ts                   — врачи, расписание, исключения, настройки
│   ├── grooming.ts
│   └── users.ts
│
├── modules/                         — бизнес-модули
│   ├── animals/
│   │   ├── domain/types.ts
│   │   └── features/AnimalsTable/ + AnimalFormDialog/
│   ├── categories/
│   │   ├── domain/types.ts
│   │   └── features/CategoriesTable/ + CategoryFormDialog/
│   ├── articles/
│   │   ├── domain/types.ts
│   │   └── features/ArticlesTable/
│   ├── doctors/
│   │   ├── domain/types.ts          — Doctor, DoctorScheduleSlot, DAY_NAMES…
│   │   └── features/DoctorsTable/
│   ├── grooming/
│   │   ├── domain/types.ts
│   │   └── features/ BreedsTable/ + WeeklyTemplate/ + DayTimeline/ + AppointmentFormDialog/
│   └── auth/
│       ├── domain/types.ts
│       └── features/LoginForm/
│
├── screens/                         — страницы (Layout + модули)
│   ├── ClinicInfoScreen/            — О клинике: название, контакты, лого, баннер
│   ├── LoginScreen/
│   ├── AnimalsScreen/
│   ├── CategoriesScreen/
│   ├── ArticlesScreen/
│   ├── ArticleEditorScreen/         — WYSIWYG редактор (TipTap)
│   ├── DoctorsScreen/
│   ├── DoctorEditorScreen/          — карточка + фото + расписание + исключения
│   ├── ScheduleScreen/
│   ├── UsersScreen/
│   └── GroomingScreen/
│
└── shared/
    ├── config/AuthContext.tsx       — JWT в localStorage, useAuth(), claims
    ├── theme/theme.ts               — MUI тема (primary=#2e7d32)
    └── ui/
        ├── Layout/                  — Drawer sidebar + AppBar + hamburger
        ├── ProtectedRoute.tsx
        ├── ConfirmDialog/
        ├── Notification/            — NotificationContext, useNotification()
        └── RichTextEditor/          — TipTap обёртка
```

## Роутинг

| Путь | Экран | Доступ |
|---|---|---|
| `/login` | LoginScreen | Публичный |
| `/clinic-info` | ClinicInfoScreen | admin, editor |
| `/animals` | AnimalsScreen | admin, editor |
| `/categories` | CategoriesScreen | admin, editor |
| `/articles` | ArticlesScreen | admin, editor |
| `/articles/new` | ArticleEditorScreen | admin, editor |
| `/articles/:id/edit` | ArticleEditorScreen | admin, editor |
| `/doctors` | DoctorsScreen | admin, editor |
| `/doctors/new` | DoctorEditorScreen | admin, editor |
| `/doctors/:id/edit` | DoctorEditorScreen | admin, editor |
| `/schedule` | ScheduleScreen | admin, editor |
| `/users` | UsersScreen | только admin |
| `/grooming` | GroomingScreen | admin, editor, groomer |

`groomer` → редирект на `/grooming` при попытке зайти на любой другой маршрут.
Роутер использует `createBrowserRouter` — обязательно для `useBlocker`.

## Паттерны

### Запросы (TanStack Query)

```ts
// Чтение
const { data, isLoading } = useQuery({ queryKey: ['clinic-info'], queryFn: getClinicInfo });

// Мутация с инвалидацией кеша
const mutation = useMutation({
  mutationFn: (input) => updateClinicInfo(input),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clinic-info'] }),
});
```

### Формы (React Hook Form + Valibot)

```ts
const schema = v.object({ full_name: v.pipe(v.string(), v.minLength(1, 'Обязательно')) });
const form = useForm({ resolver: valibotResolver(schema), defaultValues: { full_name: '' } });
```

### Роли

```tsx
const { user } = useAuth();
const isAdmin = user?.role === 'admin';

{isAdmin && <Button onClick={publish}>Опубликовать</Button>}
```

### Защита от ухода без сохранения

Все экраны редактирования: `useBlocker(isDirty)` + `window.addEventListener('beforeunload', ...)`.

### Мобильная адаптация

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

## Добавление нового раздела (чеклист)

1. Типы → `src/modules/<module>/domain/types.ts`
2. API → `src/data/source/<module>.ts`
3. Таблица → `src/modules/<module>/features/<Module>Table/`
4. Экран → `src/screens/<Module>Screen/index.tsx`
5. Роут → `src/App.tsx` (lazy import + route)
6. Навигация → `NAV_ITEMS` в `src/shared/ui/Layout/index.tsx`

## Оптимизация бандла

- `React.lazy()` + `<Suspense>` для всех экранов
- `manualChunks` в `vite.config.ts`

| Чанк | Содержимое | Размер (gzip) |
|---|---|---|
| vendor-mui | @mui/material, @mui/icons-material | ~104 kB |
| vendor-tiptap | @tiptap/*, prosemirror-* | ~90 kB |
| vendor-react | react, react-dom, react-router-dom | ~95 kB |
| vendor-query | @tanstack/react-query | ~23 kB |
