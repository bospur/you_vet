# Архитектура фронтенда

## Структура проекта (FSD-like)

```
src/
├── App.tsx                        — роутинг (createBrowserRouter), lazy loading
├── main.tsx                       — точка входа
│
├── data/
│   └── source/                    — axios вызовы к API
│       ├── axiosInstance.ts       — axios с Bearer interceptor
│       ├── animals.ts
│       ├── categories.ts
│       ├── articles.ts
│       ├── doctors.ts             — врачи, расписание, исключения, настройки
│       ├── users.ts
│       └── grooming.ts            — породы, шаблон недели, записи грумера
│
├── modules/                       — бизнес-модули
│   ├── animals/
│   │   ├── domain/types.ts        — Animal, AnimalFormValues
│   │   └── features/
│   │       ├── AnimalsTable/      — таблица / карточки
│   │       └── AnimalFormDialog/  — диалог создания/редактирования
│   ├── categories/
│   │   ├── domain/types.ts
│   │   └── features/
│   │       ├── CategoriesTable/
│   │       └── CategoryFormDialog/
│   ├── articles/
│   │   ├── domain/types.ts        — Article, ArticleFormValues, ArticleStatus
│   │   └── features/
│   │       └── ArticlesTable/     — таблица / карточки, publish/edit/delete
│   ├── doctors/
│   │   ├── domain/types.ts        — Doctor, DoctorScheduleSlot, DoctorScheduleException,
│   │   │                            ClinicSettings, ScheduleEntry, DAY_NAMES
│   │   └── features/
│   │       └── DoctorsTable/      — таблица / карточки с аватаром
│   ├── grooming/
│   │   ├── domain/types.ts        — GroomingBreed, GroomingTemplateSlot, GroomingAppointment,
│   │   │                            DAY_NAMES_SHORT, DAY_NAMES_FULL
│   │   └── features/
│   │       ├── BreedsTable/       — таблица / карточки пород
│   │       ├── BreedFormDialog/   — диалог создания/редактирования породы
│   │       ├── WeeklyTemplate/    — 7 переключателей + time inputs, auto-save
│   │       ├── DayTimeline/       — пиксельная сетка дня (2px/мин), hover-слоты, блоки записей
│   │       └── AppointmentFormDialog/ — форма записи (порода, кличка, телефон, время)
│   └── auth/
│       ├── domain/types.ts
│       └── features/
│           └── LoginForm/
│
├── screens/                       — страницы (Layout + модули + логика)
│   ├── LoginScreen/
│   ├── AnimalsScreen/
│   ├── CategoriesScreen/
│   ├── ArticlesScreen/            — список + publish/delete
│   ├── ArticleEditorScreen/       — full-page WYSIWYG редактор
│   ├── DoctorsScreen/             — список врачей
│   ├── DoctorEditorScreen/        — карточка + фото + расписание + исключения
│   ├── ScheduleScreen/            — расписание клиники + настройка периода
│   ├── UsersScreen/               — управление пользователями (только admin)
│   └── GroomingScreen/            — породы + шаблон + месячный календарь + тайм-лайн
│
└── shared/
    ├── config/
    │   └── AuthContext.tsx        — JWT в localStorage, декодирование claims, useAuth()
    ├── theme/
    │   └── theme.ts               — MUI тема (primary=#2e7d32)
    └── ui/
        ├── Layout/                — Drawer sidebar + AppBar + hamburger (mobile)
        ├── ProtectedRoute.tsx     — редирект на /login если нет токена
        ├── ConfirmDialog/         — переиспользуемый диалог подтверждения
        ├── Notification/          — NotificationContext, useNotification()
        └── RichTextEditor/        — TipTap WYSIWYG обёртка
```

## Паттерны

### Запросы к API (TanStack Query)
```ts
// Чтение
const { data, isLoading } = useQuery({ queryKey: ['doctors'], queryFn: getDoctors });

// Мутация с инвалидацией кеша
const mutation = useMutation({
  mutationFn: (id) => deleteDoctor(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctors'] }),
});
```

### Формы (React Hook Form + Valibot)
```ts
const schema = v.object({ full_name: v.pipe(v.string(), v.minLength(1, 'Обязательно')) });
const form = useForm({ resolver: valibotResolver(schema), defaultValues: { full_name: '' } });
```

### Авторизация и роли
`AuthContext` хранит JWT в `localStorage` и декодирует claims (`user_id`, `clinic_id`, `role`).
`axiosInstance` автоматически добавляет `Authorization: Bearer <token>`.

```tsx
const { user } = useAuth();
const isAdmin = user?.role === 'admin';
```

### Защита от ухода без сохранения
Все формы редактирования используют `useBlocker` (React Router) + `beforeunload` event.

## Роутинг

| Путь | Экран | Доступ |
|------|-------|--------|
| `/login` | LoginScreen | Публичный |
| `/animals` | AnimalsScreen | Все роли |
| `/categories` | CategoriesScreen | Все роли |
| `/articles` | ArticlesScreen | Все роли |
| `/articles/new` | ArticleEditorScreen | Все роли |
| `/articles/:id/edit` | ArticleEditorScreen | Все роли |
| `/doctors` | DoctorsScreen | Все роли |
| `/doctors/new` | DoctorEditorScreen | Все роли |
| `/doctors/:id/edit` | DoctorEditorScreen | Все роли |
| `/schedule` | ScheduleScreen | Все роли (настройки — только admin) |
| `/users` | UsersScreen | Только admin (в UI) |
| `/grooming` | GroomingScreen | Все роли |

Роутер использует `createBrowserRouter` — обязательно для работы `useBlocker`.

## Ролевая модель

| Действие | editor | admin |
|----------|--------|-------|
| Создавать/редактировать черновики | ✅ | ✅ |
| Публиковать статьи и врачей | ❌ | ✅ |
| Редактировать опубликованные | ❌ | ✅ |
| Управлять пользователями | ❌ | ✅ |
| Менять настройки клиники | ❌ | ✅ |

## Мобильная адаптация

- `Layout` при `< md` → временный Drawer с hamburger
- Все таблицы при `< sm` → card view (Paper карточки)
- Кнопки "Добавить" при `< sm` → только `IconButton`
- Формы — вертикальный `Stack`, адаптируются автоматически

## Оптимизация бандла

- `React.lazy()` + `<Suspense>` для всех экранов
- `manualChunks` в `vite.config.ts`

| Чанк | Содержимое | Размер (gzip) |
|------|-----------|---------------|
| vendor-mui | @mui/material, @mui/icons-material | ~104 kB |
| vendor-tiptap | @tiptap/*, prosemirror-* | ~90 kB |
| vendor-emoji | emoji-picker-react | ~77 kB |
| vendor-react | react, react-dom, react-router-dom | ~95 kB |
| vendor-query | @tanstack/react-query | ~23 kB |
