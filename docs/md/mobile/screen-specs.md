# Mobile App — спецификация экранов (RuStore v1)

> Статус: проектирование · Обновлено: 2026-06-09  
> Основа: [design-mvp.md](./design-mvp.md) · parity с `apps/app`

Для каждого экрана: макет, элементы, API, состояния, навигация.  
Префикс API: `GET/POST …/api/mobile/v1/clinics/{slug}/…` (M0).

---

## Общие правила UI

### AppShell

| Режим | Tab bar | AppBar |
|---|---|---|
| Splash, auth (`/auth/*`) | скрыт | свой заголовок |
| Tab roots (`/`, `/booking`, `/animals`, `/more`) | виден | клиника + телефон (как `AppHeader`) |
| Вложенные экраны | виден | «‹ Назад» + заголовок экрана |
| Booking flow (`/booking/new…`) | скрыт или виден² | «‹ Назад» + шаг |

² **Решение v1:** tab bar **остаётся** на booking flow — пользователь не «теряется»; активная вкладка «Запись».

### AppBar (tab roots)

```
┌────────────────────────────────────────┐
│ [logo] Ветпрактика              [📞]   │
└────────────────────────────────────────┘
```

- Tap на название → `/` (главная)
- Tap 📞 → `tel:{phone}` (из `clinic-info`)
- Лого: `{API_URL}{logo_url}`

### AppBar (вложенный)

```
┌────────────────────────────────────────┐
│ ‹ Назад    Заголовок                   │
└────────────────────────────────────────┘
```

### Tab bar

| Tab | Route | Иконка | Badge |
|---|---|---|---|
| Главная | `/` | home | — |
| Запись | `/booking` | calendar | — |
| Статьи | `/animals` | book | — |
| Ещё | `/more` | more | — |

Скрыть tab «Запись», если `GET …/booking/service-types` → `[]` (как `useBookingAvailable`).

### Глобальные состояния

| Состояние | UI |
|---|---|
| Loading | `Spinner` fullscreen или skeleton |
| Error | `ErrorState` + «Повторить» (`refetch`) |
| Offline | banner вверху + cached `clinic-info` если есть |
| Toast | успех/ошибка действий (заявка, отмена, auth) |

### Auth guard

```ts
// псевдо
requireAuth(returnUrl) → если нет access_token → /auth/login?return=…
```

Protected: S13–S16, мутации booking.

---

## S00 — Splash

| | |
|---|---|
| **Route** | `/splash` (initial) |
| **Auth** | — |
| **Tab bar** | скрыт |

### Макет

```
┌──────────────────────┐
│                      │
│      [logo]          │
│     Ветпрактика      │
│      ◌ loading       │
│                      │
└──────────────────────┘
```

### Логика bootstrap

1. `Preferences.get('access_token')` — прогрев auth state
2. `GET …/clinic-info` — имя, лого, телефон → `ClinicContext`
3. Параллельно: prefetch `booking/service-types` (для tab visibility)
4. Min display **800 ms** (не мигать)
5. `replace` → `/` (или `return` из deep link)

### Ошибки

- `clinic-info` fail → `/` с banner «Нет связи»; retry на главной

---

## S01 — Home (tab)

| | |
|---|---|
| **Route** | `/` |
| **Mini App** | `HomeScreen` |

### Макет (scroll)

```
[AppBar: клиника + телефон]

┌─ Hero «О нас» ─────────────────┐
│ Название, слоган               │
│ Адрес (tap → maps / geo:)      │
│ [Развернуть описание]          │
└────────────────────────────────┘

Полезное
┌────────┐ ┌────────┐
│Записать│ │Статьи  │   ← NavCard grid (2 col)
└────────┘ └────────┘
┌────────┐ ┌────────┐
│Врачи   │ │Распис. │
└────────┘ └────────┘
[Груминг — если доступен]

┌─ Сегодня в клинике ────────────┐  ← если есть слоты на сегодня
│ N врачей · Иванов, Петров…     │  tap → /schedule
└────────────────────────────────┘

Рекомендуем
┌─ статья 1 ─────────────────────┐
└────────────────────────────────┘

[banner — если banner_enabled]

┌────────────────────────────────┐
│      📞 Позвонить в клинику     │  sticky bottom (над tab bar)
└────────────────────────────────┘
```

### NavCards (полезное)

| Карточка | Условие | Navigate |
|---|---|---|
| Записаться | booking available | `/booking` |
| Статьи | всегда | `/animals` |
| Наши врачи | всегда | `/doctors` |
| Расписание | всегда | `/schedule` |
| Груминг | breeds или schedule не пуст | `/grooming` |

Skeleton карточек пока грузится availability (как Mini App).

### API

| Query | Endpoint |
|---|---|
| `clinic-info` | `GET …/clinic-info` |
| `featured` | `GET …/articles/featured` |
| `schedule` | `GET …/schedule` (для TodayAtClinic) |
| `booking-available` | `GET …/booking/service-types` |
| `grooming-available` | `GET …/grooming/breeds` + schedule |

### Действия

- Banner close → `Preferences` `banner_dismissed_v1`
- About expand → session flag (или Preferences)

---

## S02 — Animals (tab root для «Статьи»)

| | |
|---|---|
| **Route** | `/animals` |
| **Mini App** | `AnimalsScreen` |

### Макет

```
AppBar: ‹ не нужен (tab root) — заголовок «Статьи» в контенте или AppBar

Список NavRow:
  🐱 Кошки        ›
  🐕 Собаки       ›
  …
```

### API

`GET …/animals` → `{ id, name, slug, icon }`

### Empty / Error

- Пусто → «Пока нет материалов»
- Error → toast + retry

### Navigate

Row tap → `/animals/{slug}/articles`

---

## S03 — Articles list

| | |
|---|---|
| **Route** | `/animals/:animalSlug/articles` |
| **Mini App** | `ArticlesScreen` |

### AppBar

`‹ Назад` · `{animal.name}`

### Макет

```
NavRow list:
  Название статьи    ›
```

### API

`GET …/animals/{animalSlug}/articles`

---

## S04 — Article

| | |
|---|---|
| **Route** | `/articles/:articleSlug` |
| **Mini App** | `ArticleScreen` |

### AppBar

`‹ Назад` · заголовок статьи (truncate)

### Контент

- `HtmlContent` — `content` из API (sanitize: DOMPurify)
- `ScrollToTopFab` при scroll > 400px (опционально v1)

### API

`GET …/articles/{articleSlug}`

---

## S05 — Doctors

| | |
|---|---|
| **Route** | `/doctors` |
| **Mini App** | `DoctorsScreen` |

### Вход

Tab «Ещё» или NavCard с главной.

### Макет

```
NavRow:
  [Avatar] ФИО
           специальность    ›
```

### API

`GET …/doctors` → published only

---

## S06 — Doctor card

| | |
|---|---|
| **Route** | `/doctors/:doctorId` |
| **Mini App** | `DoctorScreen` |

### Макет

```
[Photo large]
ФИО
Специальность

Описание (text)

Контакты (если есть)

Ближайшие приёмы (из schedule, filter by doctor_id)
```

### API

- `GET …/doctors` (find by id) или отдельный endpoint если появится
- `GET …/schedule` — фильтр на клиенте

---

## S07 — Schedule

| | |
|---|---|
| **Route** | `/schedule` |
| **Mini App** | `ScheduleScreen` |

### Макет

Группировка по дате:

```
Пн, 10 июня
  [Avatar] Иванов И.   09:00–14:00
  [Avatar] Петрова А.  10:00–18:00
```

### API

`GET …/schedule` → `entries[]`

---

## S08–S10 — Grooming

| Screen | Route | Mini App |
|---|---|---|
| S08 Hub | `/grooming` | `GroomingScreen` |
| S09 Breeds | `/grooming/breeds` | `GroomingBreedsScreen` |
| S10 Schedule | `/grooming/schedule` | `GroomingScheduleScreen` |

**Guard:** если breeds и schedule пусты — redirect `/` или скрыть пункт в «Ещё».

### S08 Hub

```
NavRow: Услуги и породы    ›
NavRow: График работы      ›
```

### S09 Breeds

Карточки: порода, услуга, цена от–до, длительность.

API: `GET …/grooming/breeds`

### S10 Schedule

Дни недели + часы.

API: `GET …/grooming/schedule`

---

## S11 — More (tab)

| | |
|---|---|
| **Route** | `/more` |

### Макет

```
NavRow: Наши врачи           ›  → /doctors
NavRow: Расписание           ›  → /schedule
NavRow: Груминг              ›  → /grooming (if available)
─────────────────
NavRow: Настройки            ›  → /settings
NavRow: О приложении         ›  → modal / screen

Footer: версия 1.0.0 (build)
```

---

## S12 — Booking hub (tab)

| | |
|---|---|
| **Route** | `/booking` |
| **Auth** | soft |
| **Mini App** | `BookingScreen` |

### Макет

```
Запись на приём

NavRow: 📅 Записаться
        Выбор услуги и даты     ›

NavRow: 📋 Мои заявки
        Статус ваших записей    ›
```

### Auth

| Действие | Без JWT |
|---|---|
| «Записаться» | → `/auth/login?return=/booking/new` |
| «Мои заявки» | → `/auth/login?return=/booking/requests` |

С JWT — прямой переход.

### Неавторизованный hint (опционально)

Под списком: «Войдите по номеру телефона, чтобы записаться» + кнопка «Войти».

---

## S13 — Booking: выбор услуги

| | |
|---|---|
| **Route** | `/booking/new` |
| **Auth** | ✅ required |
| **Mini App** | `BookingServicesScreen` |

### AppBar

`‹ Назад` → `/booking`

### Макет

Секции по категории (`uzi`, `surgery`, `xray`):

```
── УЗИ ──
┌─────────────────────────────┐
│ УЗИ брюшной полости         │
│ ~30 мин · для кошек         │
│ Заявка / мгновенно          │
└─────────────────────────────┘
```

### API

`GET …/booking/service-types`

### Navigate

Card tap → `/booking/new/{id}/date`

---

## S14 — Booking: дата и слот

| | |
|---|---|
| **Route** | `/booking/new/:serviceId/date` |
| **Auth** | ✅ |
| **Mini App** | `BookingDateScreen` |

### Режимы (`schedule_style`)

| Style | UI |
|---|---|
| `day_capacity` / `dropoff` | список дней, tap день → форма |
| `time_slots` | список дней → экран слотов (`?selectDate=YYYY-MM-DD`) → форма с `?time=HH:MM` |

### Правила слотов

- Сегодня: не показывать прошедшее время (`availableSlotsForDay` из `domain/booking/timeSlots`)
- День `remaining === 0` — disabled
- `instructions_client` — текст под заголовком

### API

- `GET …/booking/service-types`
- `GET …/booking/availability?service_type_id={id}`

### Navigate

- День (без слотов) → `/booking/new/{id}/date/{date}`
- Со слотом → `…/date/{date}?time=10:00`

---

## S15 — Booking: форма заявки

| | |
|---|---|
| **Route** | `/booking/new/:serviceId/date/:date` |
| **Auth** | ✅ |
| **Mini App** | `BookingFormScreen` |

### AppBar

`‹ Назад` → date screen

### Поля

| Поле | Тип | Обязательно |
|---|---|---|
| Услуга, дата | read-only summary | — |
| Время слота | read-only (если time_slots) | — |
| Ваше имя | text | да |
| Телефон | PhoneField `+7` | да |
| Кличка питомца | text | да |
| Возраст (лет) | number | по `rules` услуги |

Телефон **предзаполнить** из JWT/profile если есть.

### Валидация

Логика из `domain/booking/rules.ts` (как Mini App).

### Submit

```
POST …/booking/requests
{
  service_type_id, requested_date, slot_time?,
  client_name, client_phone, pet_name, pet_age_years?
}
```

Success → toast «Заявка отправлена» → `/booking/requests`  
Error → inline `formError` из API message

### Согласие ПДн

Чекбокс: «Согласен на обработку персональных данных» (ссылка на privacy URL) — **обязателен** перед submit (RuStore / 152-ФЗ).

---

## S16 — Мои заявки

| | |
|---|---|
| **Route** | `/booking/requests` |
| **Auth** | ✅ |
| **Mini App** | `BookingRequestsScreen` |

### Tabs

```
[ Активные ] [ Архив ]
```

- **Активные:** `pending`, `confirmed`, `rescheduled`
- **Архив:** `cancelled`, `rejected`

### Карточка заявки

```
┌─────────────────────────────┐
│ УЗИ брюшной    [Ожидает]    │
│ 12 июня · 10:00 · Мурзик    │
│ [Отменить заявку]           │
└─────────────────────────────┘
```

Отмена: confirm row «Да, отменить» / «Нет»

### API

- `GET …/booking/requests`
- `PATCH …/booking/requests/{id}` `{ status: "cancelled" }`

Cancel только для `pending` | `confirmed`.

### Empty

«У вас пока нет заявок» + CTA «Записаться»

---

## S17 — Login (телефон)

| | |
|---|---|
| **Route** | `/auth/login?return=…` |
| **Tab bar** | скрыт |

### Макет

```
Вход

Введите номер телефона —
код придёт в Telegram

┌ +7 (___) ___-__-__ ┐
[ Получить код ]

Нет Telegram? Привяжите бота…
```

### API

```
POST …/auth/request { "phone": "+79…" }
```

| Response | Действие |
|---|---|
| 200 | → `/auth/verify?phone=…&return=…` |
| 404 `PHONE_NOT_LINKED` | → `/auth/link-telegram` |
| 429 | «Слишком часто, попробуйте через N мин» |

---

## S18 — Verify (код)

| | |
|---|---|
| **Route** | `/auth/verify` |

### Макет

```
Код из Telegram

Мы отправили код на номер
+7 *** ***-**-45

┌ _ _ _ _ _ _ ┐  (6 цифр, auto-advance)
[ Войти ]

Отправить код повторно (через 60 с)
```

### API

```
POST …/auth/verify { phone, code }
→ { access_token, refresh_token, expires_in }
```

Store tokens → `Preferences` → redirect `return` or `/booking`

---

## S19 — Link Telegram

| | |
|---|---|
| **Route** | `/auth/link-telegram` |

### Макет

```
Привяжите Telegram

1. Откройте @VPract_bot
2. Нажмите /start
3. Поделитесь номером телефона

[ Открыть Telegram ]
[ Я уже привязал — ввести номер ]
```

### Действия

- «Открыть Telegram» → `https://t.me/VPract_bot?start=link` (`@capacitor/app` / Browser)
- Вторая кнопка → `/auth/login`

---

## S20 — Settings

| | |
|---|---|
| **Route** | `/settings` |
| **Auth** | optional (без JWT — только «О приложении») |

### Макет (с JWT)

```
Профиль
  Телефон: +7 *** **-45

[ Выйти ]

О приложении
  Версия 1.0.0
  Политика конфиденциальности ↗
```

Logout → clear tokens → `/`

---

## Матрица API по экранам

| Screen | GET | POST | PATCH |
|---|---|---|---|
| S00 | clinic-info | — | — |
| S01 | clinic-info, featured, schedule, service-types, grooming | — | — |
| S02–S04 | animals, articles, article | — | — |
| S05–S07 | doctors, schedule | — | — |
| S08–S10 | grooming/* | — | — |
| S13–S15 | service-types, availability | requests | — |
| S16 | requests | — | requests/{id} |
| S17–S18 | — | auth/request, auth/verify | — |

---

## Порядок реализации (frontend)

| Sprint | Экраны |
|---|---|
| 1 | S00, Shell, S01, tab bar |
| 2 | S02–S04, S11 |
| 3 | S05–S10 |
| 4 | S17–S19, auth context |
| 5 | S12–S16 booking |
| 6 | S20, polish, offline banner |

---

## Changelog

| Дата | Изменение |
|---|---|
| 2026-06-09 | Первая версия: 21 экран, поля, API, auth gates |
