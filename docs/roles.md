# Ролевая модель

## Роли

| Роль | Описание |
|---|---|
| `admin` | Полный доступ ко всему **в рамках клиники** |
| `manager` | Раздел «Запись» (`/booking`); в UI — **Менеджер** |
| `editor` | Создание и редактирование контента, управление информацией о клинике |
| `groomer` | Только раздел груминга |
| `superadmin` | *(planned)* Платформа: мониторинг, ошибки, деплой — только разработчик; см. [deployment.md](./deployment.md) |

> `superadmin` пока **не реализован** в коде; в JWT и UI есть только роли выше.

JWT токен содержит: `user_id`, `clinic_id`, `role`, `exp` (24h).

## Матрица прав (продуктовая)

| Действие | editor | manager | admin | groomer |
|---|---|---|---|---|
| Информация о клинике (О клинике) | ✅ | ❌ | ✅ | ❌ |
| Создавать/редактировать черновики (статьи, врачи) | ✅ | ❌ | ✅ | ❌ |
| Публиковать статьи и врачей | ❌ | ❌ | ✅ | ❌ |
| Редактировать опубликованные | ❌ | ❌ | ✅ | ❌ |
| Удалять контент | ✅ | ❌ | ✅ | ❌ |
| Управлять пользователями | ❌ | ❌ | ✅ | ❌ |
| Менять настройки расписания | ❌ | ❌ | ✅ | ❌ |
| Груминг (породы, шаблон, записи) | ✅ | ❌ | ✅ | ✅ |
| Запись на приём (`/booking`) | ❌ | ✅ | ✅ | ❌ |
| Настройки записи (чат врачей, `/link_staff`) | ❌ | ❌ | ✅ | ❌ |

## Поведение в UI (admin)

- `groomer` — все маршруты кроме `/grooming` редиректят на `/grooming`
- `manager` — только `/booking` (default при входе)
- `editor` — кнопки публикации и редактирования опубликованного скрыты
- `admin` — полный доступ, вкладка «Настройки» в «Запись», раздел «Пользователи»

## Проверка прав на бэкенде

> Обновлено 2026-05-30 после security hardening.

### Middleware

| Слой | Файл | Что делает |
|---|---|---|
| JWT | `middleware/auth.go` | Проверяет Bearer-токен, кладёт claims в context |
| Роли | `middleware/role.go` | `RequireRole(...)` — 403 если роль не в списке |
| CORS | `middleware/cors.go` | Whitelist origin (admin/app prod + localhost) |
| Login | `middleware/ratelimit.go` | 10 попыток / 15 мин на IP |

### Группы роутов (`main.go`)

| Wrapper | Роли | Роуты |
|---|---|---|
| `contentAuth` | admin, editor | animals, categories, articles, doctors, schedule, clinic-info |
| `groomingAuth` | admin, editor, groomer | `/api/admin/grooming/*` |
| `bookingAuth` | admin, manager | `/api/admin/booking/*` (кроме settings PATCH/link-chat) |
| `adminAuth` | admin | users, settings PATCH, article/doctor status PATCH, booking settings PATCH/link-chat |

### Дополнительные проверки в handlers

| Операция | Правило |
|---|---|
| `UpdateArticle` | editor не может редактировать published |
| `DeleteArticle` | editor не может удалять published |
| Publish status | только admin (роут + handler) |

### Tenant-scoping

Все update/delete в repositories фильтруют по `clinic_id` из JWT.
Create всегда использует `claims.ClinicID`.

## Создание первого пользователя

При первом запуске (пустая `users`) создаётся admin из `ADMIN_LOGIN` / `ADMIN_PASSWORD` с `clinic_id = 1`.
