# API Reference

Base URL: `https://api.snzbeachvolleyball25.ru`

Все admin-эндпоинты требуют заголовок:
```
Authorization: Bearer <JWT>
```

JWT действует **24 часа** и содержит `user_id`, `clinic_id`, `role`.

---

## Публичный API

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/clinics/{slug}/animals` | Список животных клиники |
| GET | `/api/clinics/{slug}/animals/{slug}/categories` | Категории животного |
| GET | `/api/clinics/{slug}/animals/{a}/categories/{c}/articles` | Статьи категории |
| GET | `/api/clinics/{slug}/articles/{slug}` | Одна статья |
| GET | `/api/clinics/{slug}/doctors` | Опубликованные врачи |
| GET | `/api/clinics/{slug}/schedule` | Расписание `{ entries[], settings }` |
| GET | `/uploads/{filename}` | Фото врачей (статика) |

---

## Admin API

### Авторизация

| Метод | URL | Описание |
|---|---|---|
| POST | `/api/admin/login` | Получить JWT. Body: `{ login, password }` |

---

### Животные и категории

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/admin/animals` | Список |
| POST | `/api/admin/animals` | Создать |
| PUT | `/api/admin/animals/{id}` | Обновить |
| DELETE | `/api/admin/animals/{id}` | Удалить |
| GET | `/api/admin/categories` | Список |
| POST | `/api/admin/categories` | Создать |
| PUT | `/api/admin/categories/{id}` | Обновить |
| DELETE | `/api/admin/categories/{id}` | Удалить |

---

### Статьи

| Метод | URL | Описание | Роль |
|---|---|---|---|
| GET | `/api/admin/articles` | Список | все |
| POST | `/api/admin/articles` | Создать черновик | все |
| GET | `/api/admin/articles/{id}` | Одна статья | все |
| PUT | `/api/admin/articles/{id}` | Обновить | все (черновик) |
| DELETE | `/api/admin/articles/{id}` | Удалить | все |
| PATCH | `/api/admin/articles/{id}/status` | Сменить статус | только admin |
| POST | `/api/admin/articles/{id}/categories/{catId}` | Привязать категорию | все |
| DELETE | `/api/admin/articles/{id}/categories/{catId}` | Отвязать категорию | все |

Поле `content` — HTML-строка от TipTap.
Статусы: `draft` → `published` (только admin).

---

### Врачи

| Метод | URL | Описание | Роль |
|---|---|---|---|
| GET | `/api/admin/doctors` | Список | все |
| POST | `/api/admin/doctors` | Создать | все |
| GET | `/api/admin/doctors/{id}` | Один врач | все |
| PUT | `/api/admin/doctors/{id}` | Обновить | все |
| DELETE | `/api/admin/doctors/{id}` | Удалить | все |
| PATCH | `/api/admin/doctors/{id}/status` | Сменить статус | только admin |
| POST | `/api/admin/doctors/{id}/photo` | Загрузить фото (multipart, max 5 МБ) | все |

### Расписание врачей

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/admin/doctors/{id}/schedule` | Слоты расписания |
| POST | `/api/admin/doctors/{id}/schedule` | Добавить слот |
| DELETE | `/api/admin/doctors/{id}/schedule/{slotId}` | Удалить слот |
| GET | `/api/admin/doctors/{id}/schedule/exceptions` | Исключения (отгулы/подработки) |
| PUT | `/api/admin/doctors/{id}/schedule/exceptions` | Upsert исключения |
| DELETE | `/api/admin/doctors/{id}/schedule/exceptions/{id}` | Удалить исключение |

### Настройки клиники

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/admin/settings` | Получить настройки |
| PATCH | `/api/admin/settings` | Обновить (только admin) |

Поле `schedule_display_weeks` — сколько недель показывать в расписании.

---

### Груминг

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/admin/grooming/breeds` | Список пород |
| POST | `/api/admin/grooming/breeds` | Создать породу |
| PUT | `/api/admin/grooming/breeds/{id}` | Обновить |
| DELETE | `/api/admin/grooming/breeds/{id}` | Удалить |
| GET | `/api/admin/grooming/template` | Шаблон рабочей недели |
| PUT | `/api/admin/grooming/template` | Upsert рабочего дня |
| DELETE | `/api/admin/grooming/template/{dayOfWeek}` | Убрать рабочий день |
| GET | `/api/admin/grooming/appointments?month=YYYY-MM` | Записи за месяц |
| POST | `/api/admin/grooming/appointments` | Создать запись |
| DELETE | `/api/admin/grooming/appointments/{id}` | Удалить запись |

**Бизнес-логика POST /appointments:**
1. Берёт `duration` из `grooming_breeds`
2. Проверяет что дата — рабочий день по шаблону (`day_of_week`) → 400 если нет
3. Вычисляет `end_time = start_time + duration` через PostgreSQL
4. Проверяет что время в рамках рабочего окна → 400 если нет
5. Проверяет пересечение с существующими записями → 409 если занято

---

### Пользователи

| Метод | URL | Описание | Роль |
|---|---|---|---|
| GET | `/api/admin/users` | Список | только admin |
| POST | `/api/admin/users` | Создать | только admin |
| DELETE | `/api/admin/users/{id}` | Удалить | только admin |

---

## Форматы

### day_of_week
PostgreSQL-конвенция: `0=Вс, 1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб`

### Статусы контента
`draft` — черновик (по умолчанию при создании)
`published` — опубликован (бот/app показывают только published)
