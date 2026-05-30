# Ролевая модель

## Роли

| Роль | Описание |
|---|---|
| `admin` | Полный доступ ко всему |
| `editor` | Создание и редактирование контента, управление информацией о клинике |
| `groomer` | Только раздел груминга |

JWT токен содержит: `user_id`, `clinic_id`, `role`, `exp` (24h).

## Матрица прав (продуктовая)

| Действие | editor | admin | groomer |
|---|---|---|---|
| Информация о клинике (О клинике) | ✅ | ✅ | ❌ |
| Создавать/редактировать черновики (статьи, врачи) | ✅ | ✅ | ❌ |
| Публиковать статьи и врачей | ❌ | ✅ | ❌ |
| Редактировать опубликованные | ❌ | ✅ | ❌ |
| Удалять контент | ✅ | ✅ | ❌ |
| Управлять пользователями | ❌ | ✅ | ❌ |
| Менять настройки расписания | ❌ | ✅ | ❌ |
| Груминг (породы, шаблон, записи) | ✅ | ✅ | ✅ |

## Поведение в UI (admin)

- `groomer` — все маршруты кроме `/grooming` редиректят на `/grooming` (`NonGroomerRoute` в `App.tsx`)
- `editor` — кнопки публикации и редактирования опубликованного скрыты
- `admin` — полный доступ, раздел «Пользователи» в навигации

```tsx
const { user } = useAuth();
const isAdmin = user?.role === 'admin';

// Скрыть публикацию для editor
{isAdmin && <Button onClick={publish}>Опубликовать</Button>}
```

## Создание первого пользователя

При первом запуске бэкенда (пустая таблица `users`) автоматически создаётся
admin из env-переменных `ADMIN_LOGIN` / `ADMIN_PASSWORD` с `clinic_id = 1`.

Последующих пользователей создаёт admin через раздел «Пользователи».

## Проверка прав на бэкенде — фактическое состояние

> ⚠️ **Важно:** JWT middleware (`internal/middleware/auth.go`) проверяет только **наличие и валидность токена**, не роль.
> Роль проверяется **выборочно** в отдельных handlers. UI admin скрывает элементы для UX, но **не является единственной защитой**.

### Где роль проверяется на бэкенде

| Handler / операция | Правило |
|---|---|
| `UpdateArticleStatus`, `DeleteArticle` (published) | admin only |
| `UpdateArticle` | editor не может редактировать published |
| `UpdateDoctorStatus` | admin only |
| `GetSettings`, `UpdateSettings` | admin only |
| `GetUsers`, `CreateUser`, `DeleteUser` | admin only |

### Где роль НЕ проверяется (только JWT)

| Ресурс | Риск |
|---|---|
| Animals, categories CRUD | groomer может изменить через API |
| Clinic info | groomer/editor без ограничений сверх матрицы |
| Grooming CRUD | editor имеет доступ (по матрице — OK), groomer — OK |
| Doctors CRUD (кроме status) | groomer может изменить через API |

### Tenant-scoping

- **Create:** использует `claims.ClinicID` из JWT ✅
- **Update/Delete:** многие репозитории фильтруют только по `id`, без `clinic_id` ⚠️

При текущем деплое (один VPS = одна клиника) риск IDOR минимален.
При переходе к multi-clinic SaaS — **обязательно** добавить `clinic_id` в WHERE.

### План hardening

См. [audit.md](./audit.md) и [context/ISSUES.md](./context/ISSUES.md) (SEC-01, SEC-02):

1. Middleware `RequireRole("admin", "editor", ...)` на группы роутов
2. `WHERE id = $1 AND clinic_id = $2` во всех mutations
