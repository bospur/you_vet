# API Reference

Base URL: `https://api.snzbeachvolleyball25.ru`

Admin-эндпоинты требуют заголовок:
```
Authorization: Bearer <JWT>
```
JWT действует **24 часа**, содержит `user_id`, `clinic_id`, `role`.

---

## Публичный API

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/clinics/{slug}/clinic-info` | Информация о клинике (название, контакты, лого, баннер) |
| GET | `/api/clinics/{slug}/animals` | Список животных |
| GET | `/api/clinics/{slug}/animals/{animalSlug}/articles` | Статьи животного (список: id, title, slug) |
| GET | `/api/clinics/{slug}/articles/featured` | Featured-статьи для главной (до 3: id, title, slug, animal_name) |
| GET | `/api/clinics/{slug}/articles/{slug}` | Одна статья |
| GET | `/api/clinics/{slug}/doctors` | Опубликованные врачи |
| GET | `/api/clinics/{slug}/schedule` | Расписание `{ entries[], settings }` |
| GET | `/api/clinics/{slug}/grooming/breeds` | Коллекция пород грумера |
| GET | `/api/clinics/{slug}/grooming/schedule` | Шаблон рабочей недели грумера |
| GET | `/uploads/{filename}` | Фото / логотипы / баннеры (статика) |

---

## Admin API

### Авторизация

| Метод | URL | Описание |
|---|---|---|
| POST | `/api/admin/login` | Получить JWT. Body: `{ login, password }` |

---

### Информация о клинике

Доступно ролям: `admin`, `editor`.

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/admin/clinic-info` | Получить текущую информацию |
| PUT | `/api/admin/clinic-info` | Обновить текстовые поля |
| POST | `/api/admin/clinic-info/logo` | Загрузить логотип (multipart, поле `image`, max 5 МБ) |
| POST | `/api/admin/clinic-info/banner` | Загрузить баннер (multipart, поле `image`, max 5 МБ) |

**PUT body:**
```json
{
  "name": "Ветеринарная клиника Здоровый питомец",
  "description": "Лечим с любовью с 2010 года",
  "phone": "+7 (999) 123-45-67",
  "address": "г. Москва, ул. Ленина, д. 1",
  "email": "info@clinic.ru",
  "website": "https://clinic.ru"
}
```

Все поля опциональны. Хранится одна запись на клинику (upsert).

---

### Животные

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/admin/animals` | Список (JWT, не initData) |
| POST | `/api/admin/animals` | Создать |
| PUT | `/api/admin/animals/{id}` | Обновить |
| DELETE | `/api/admin/animals/{id}` | Удалить |

---

### Статьи

| Метод | URL | Описание | Роль |
|---|---|---|---|
| GET | `/api/admin/articles` | Список | все |
| POST | `/api/admin/articles` | Создать черновик | все |
| GET | `/api/admin/articles/{id}` | Одна статья | все |
| PUT | `/api/admin/articles/{id}` | Обновить (черновик) | все |
| PATCH | `/api/admin/articles/{id}/status` | Сменить статус | только admin |
| PATCH | `/api/admin/articles/{id}/featured` | Показ на главной (max 3) | только admin |
| DELETE | `/api/admin/articles/{id}` | Удалить | все (опубликованные — только admin) |

**POST/PUT body:** `{ "title", "content", "animal_id" }` — slug генерируется на сервере из заголовка.

Статусы: `draft` → `published`. Опубликованные статьи видны в публичном API и боте.

---

### Врачи

| Метод | URL | Описание | Роль |
|---|---|---|---|
| GET | `/api/admin/doctors` | Список | все |
| POST | `/api/admin/doctors` | Создать | все |
| GET | `/api/admin/doctors/{id}` | Один врач | все |
| PUT | `/api/admin/doctors/{id}` | Обновить | все |
| PATCH | `/api/admin/doctors/{id}/status` | Сменить статус | только admin |
| POST | `/api/admin/doctors/{id}/photo` | Загрузить фото (multipart, поле `photo`, max 5 МБ) | все |
| DELETE | `/api/admin/doctors/{id}` | Удалить | все |

### Расписание врачей

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/admin/doctors/{id}/schedule` | Слоты расписания |
| POST | `/api/admin/doctors/{id}/schedule` | Добавить слот |
| DELETE | `/api/admin/doctors/{id}/schedule/{slotId}` | Удалить слот |
| GET | `/api/admin/doctors/{id}/schedule/exceptions` | Исключения |
| PUT | `/api/admin/doctors/{id}/schedule/exceptions` | Upsert исключения |
| DELETE | `/api/admin/doctors/{id}/schedule/exceptions/{id}` | Удалить исключение |

### Настройки клиники

| Метод | URL | Описание | Роль |
|---|---|---|---|
| GET | `/api/admin/settings` | Получить | все |
| PATCH | `/api/admin/settings` | Обновить `schedule_display_weeks` (1–5) | только admin |

---

### Груминг

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/admin/grooming/breeds` | Список пород |
| POST | `/api/admin/grooming/breeds` | Создать |
| PUT | `/api/admin/grooming/breeds/{id}` | Обновить |
| DELETE | `/api/admin/grooming/breeds/{id}` | Удалить |
| GET | `/api/admin/grooming/template` | Шаблон рабочей недели |
| PUT | `/api/admin/grooming/template` | Upsert рабочего дня (по `day_of_week`) |
| DELETE | `/api/admin/grooming/template/{dayOfWeek}` | Удалить рабочий день |
| GET | `/api/admin/grooming/appointments?month=YYYY-MM` | Записи за месяц |
| POST | `/api/admin/grooming/appointments` | Создать запись |
| DELETE | `/api/admin/grooming/appointments/{id}` | Удалить запись |

**Бизнес-логика POST /appointments:**
1. Берёт `duration` из `grooming_breeds`
2. Проверяет что дата — рабочий день по шаблону → 400 если нет
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
`published` — опубликован (виден в публичном API и боте)

### Контент статей
Поле `content` — HTML-строка, генерируется TipTap WYSIWYG редактором.
Бот конвертирует HTML → Telegram HTML через `internal/bot/htmlformat.go`.
