# Схема базы данных

PostgreSQL. Все таблицы содержат `clinic_id` для мультитенантности.

## Миграции

| Файл | Содержимое |
|---|---|
| `001_create_animals` | Таблица `animals` |
| `002_create_categories` | Таблица `categories` |
| `003_create_articles` | Таблицы `articles`, `article_categories` (M2M) |
| `004_add_multitenancy` | Добавляет `clinic_id` во все таблицы, таблица `clinics` |
| `005_add_article_status` | Поле `status` (`draft`/`published`) в `articles` |
| `006_create_doctors` | `doctors`, `doctor_schedules`, `doctor_schedule_exceptions`, `clinic_settings` |
| `007_create_grooming` | `grooming_breeds`, `grooming_weekly_template`, `grooming_appointments` |
| `008_create_clinic_info` | `clinic_info` — информация о клинике для главного экрана приложения |
| `009_articles_animal_id` | `articles.animal_id`, удаление `categories` и `article_categories` |
| `010_clinic_info_banner_enabled` | `clinic_info.banner_enabled` |
| `011_articles_featured` | `articles.featured` — показ на главной Mini App (до 3) |
| `012_telegram_users` | Учёт посетителей Mini App (Telegram user id, first_seen, last_seen) |

## Схема

### Клиники и пользователи

```
clinics
  id, slug, name

users
  id, clinic_id, login, password_hash, role (admin/editor/groomer)

telegram_users                    — посетители Mini App (не путать с users)
  id, clinic_id, telegram_user_id (bigint)
  first_seen, last_seen
  username, first_name (nullable)
  UNIQUE (clinic_id, telegram_user_id)
```

### Информация о клинике

```
clinic_info                     — одна запись на клинику (UNIQUE clinic_id)
  id, clinic_id
  name        — название клиники
  description — описание
  phone       — телефон (отображается как кнопка «Позвонить» в приложении)
  address     — адрес
  email
  website
  logo_url    — путь к файлу логотипа (/uploads/...)
  banner_url  — путь к файлу баннера (/uploads/...)
  banner_enabled — показывать блок баннера на главной Mini App (default false)
  updated_at
```

### Контент (статьи)

```
animals
  id, clinic_id, name, slug, icon, sort_order

articles
  id, clinic_id, animal_id, title, slug (unique per clinic), content (HTML), status (draft/published)
  featured (bool, default false) — блок «Рекомендуем» на главной, max 3 на клинику
```

### Врачи и расписание

```
doctors
  id, clinic_id, full_name, specialty, description, contacts, photo_url
  status (draft/published), sort_order

doctor_schedules
  id, doctor_id, day_of_week (0=Вс..6=Сб), time_from, time_to

doctor_schedule_exceptions
  id, doctor_id, date, is_day_off, time_from (nullable), time_to (nullable)

clinic_settings
  id, clinic_id, schedule_display_weeks
```

### Груминг

```
grooming_breeds
  id, clinic_id, breed, duration (мин), price (nullable), description (nullable)

grooming_weekly_template
  id, clinic_id, day_of_week (0=Вс..6=Сб), time_from, time_to

grooming_appointments
  id, clinic_id, breed_id → grooming_breeds
  date, pet_name, owner_phone
  start_time, end_time (вычисляется: start_time + breed.duration)
```

## Форматы полей

### day_of_week
PostgreSQL-конвенция: `0=Вс, 1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб`

### status (articles, doctors)
`draft` — черновик (создаётся по умолчанию)
`published` — опубликован (виден в публичном API и боте)

### content (articles)
HTML-строка, генерируется TipTap WYSIWYG редактором.
