# Фаза 5 — Запись на приём (PRD-03)

> Статус: **C1 в коде на `dev`** · B1–B4 + лимиты/слоты — deploy server+app+admin · Обновлено: 2026-06-01  
> Для клиники (простым языком): [booking-for-clinic.html](./booking-for-clinic.html)  
> Связанные документы: [roadmap.html](./roadmap.html) · [roles.md](./roles.md) · [mobile/roadmap.md](./mobile/roadmap.md)

## Суть (уточнено с клиникой)

Узкий MVP: запись только на **фиксированный каталог процедур** (УЗИ ×3, кастрация/стерилизация кошек, рентген). Не «любой врач / любая дата».

| Принцип | Решение |
|---|---|
| Каналы клиента v1 | **Mini App** (основной); бот — уведомления клиенту + посты в чат врачей |
| Ёмкость | Слоты/места на день, гибко **по услуге** (шаблон недели + разовые окна) |
| Подтверждение | **На услугу:** `instant` или `pending`; при pending место **резервируется**, статус «ожидает подтверждения» |
| Горизонт | **2 недели** вперёд |
| Операции кошек | **Общая ёмкость** на день для кастрации + стерилизации (напр. 10 мест) |
| Ресурс | Кабинет/процедура; **врач дня** — опционально в admin |
| Staff | Роль **`manager`** (Менеджер) + **один групповой чат врачей** для уведомлений бота |
| Груминг | Отдельно, пересечения по времени **не проверяем** в v1 |

**Не входит в v1:** полная запись «на любого врача», RuStore/mobile, автосдвиг очереди при отказе (см. backlog ниже).

---

## Каталог услуг (стартовый)

| Категория | Услуги | Ограничение |
|---|---|---|
| УЗИ | сердце, брюшная полость, мочевой пузырь | любое животное |
| Операции | кастрация кота, стерилизация кошки | **только кошки**; **общий лимит** на день |
| Рентген | рентген (одна услуга) | любое животное |

Длительность в справочнике — **ориентир** (зависит от животного, седации). Логистика (сдача 12–13, забор после 17) — в полях услуги / правил расписания.

**Правила (пример):** кот ≥8 лет → предупреждение «нужен осмотр и анализы» (`warn`, не блокирует в v1). JSON в `booking_service_types.rules`.

---

## Статусы заявки

| Статус | Ёмкость | Клиент видит |
|---|---|---|
| `pending` | **Занимает место** | «Ожидает подтверждения» |
| `confirmed` | Занимает | «Подтверждено на …» |
| `rejected` | **Освобождает** | «Отклонено» + причина |
| `cancelled` | Освобождает | «Отменено» |
| `rescheduled` | Менеджер переносит | «Перенесено на …» |

`booking_mode` на услуге: `instant` → при успехе сразу `confirmed`; `pending_request` → `pending` + резерв.

---

## Backlog (зафиксировать, не v1)

- **Очередь на освободившийся слот:** при отказе/отмене — уведомить следующего по времени ожидания, что место свободно; возможность сдвига времени.
- **Очередь на освободившийся слот** (см. выше) — единственный крупный backlog из антиспама.
- ~~Защита от спама~~ — **реализовано 2026-06-01** (см. «Лимиты заявок»).
- ~~Клиентский UI: возраст, rules, time_slots~~ — **C1** (см. ниже).

---

## Роли

| Роль (код) | UI | Запись |
|---|---|---|
| `admin` | Администратор | полный доступ + настройки чата |
| `manager` | Менеджер | раздел «Запись», заявки, расписание ёмкости |
| `editor` | Редактор | контент, **без** записи |
| `groomer` | Грумер | только груминг |

См. [roles.md](./roles.md).

---

## Уведомления

1. **Групповой чат врачей** (один на клинику): бот — админ группы, `staff_chat_id` в настройках записи.
2. События в чат: новая заявка, подтверждение, отмена, опционально «мало мест».
3. **Клиенту в личку** от бота при смене статуса (`telegram_user_id`).

Staff whitelist в личку бота — **не v1** (достаточно общего чата).

---

## Модель данных (миграция `013_booking`)

### `booking_service_types`

Справочник услуг: `name`, `category` (uzi|surgery|xray), `species_filter` (cats_only|any), `default_duration_min`, `booking_mode` (instant|pending_request), `schedule_style` (`day_capacity` | `time_slots` — миграция **016**), `instructions_client`, `rules` JSONB, `is_active`, `sort_order`.

**`rules` (примеры):** `pet_age` (min/max, warn/block), `confirm_message` / `reject_message` (шаблоны для staff), `limits.max_active_per_user_per_date`, `limits.max_active_per_user_per_day`.

### `booking_weekly_rules`

Шаблон по дням недели: `service_type_id`, `day_of_week`, `intake_from`/`intake_to`, `pickup_after`, `max_per_day`, `slot_mode` (day_capacity|fixed_times), `valid_from`/`valid_to`.

Для **кастрации+стерилизации** — общий `capacity_group` = `cat_surgery` (один счётчик на день).

### `booking_availability_windows`

Разовые окна (УЗИ «плавает»): `date_from`, `date_to`, дни/даты, `max_per_day`, переопределение шаблона.

### `booking_day_staff`

`date`, `service_type_id`, `doctor_id` NULL — врач дня.

### `booking_requests`

Заявка: услуга, дата, `slot_time` (nullable), клиент/питомец, `telegram_user_id`, `status`, `staff_note`, `handled_by_user_id`, `rules_ack` JSONB.

### `booking_settings` (на клинику)

`horizon_weeks` (default 2), `staff_chat_id`, опционально defaults.

---

## Admin — раздел «Запись»

**Один экран** `/booking` (внутренние вкладки). Старые пути редиректят на `?tab=`.

| Вкладка | Query | Роли | Содержание |
|---|---|---|---|
| Услуги | `?tab=services` | admin, manager | CRUD каталога |
| Расписание | `?tab=schedule` | admin, manager | Шаблон недели (**«Сохранить шаблон»**), разовые окна, календарь ёмкости |
| Заявки | `?tab=requests` | admin, manager | Очередь, confirm/reject/cancel |
| Настройки | `?tab=settings` | admin | `/link_staff`, Chat ID, горизонт (нед.) — в расписании |

Паттерн UI — как **Груминг**; mobile `< sm`.

### Бот — привязка чата

1. Бот @VPract_bot — админ группы/канала
2. Сообщение в чат: `/link_staff`
3. Admin → Запись → Настройки → «Обновить статус»

---

## API

Префикс **`/api/admin/booking/*`** — `admin`, `manager` (настройки PATCH/link-chat — только `admin`).  
Публично **`/api/clinics/{slug}/booking/*`** — initData (Mini App).

| Область | Примеры |
|---|---|
| Услуги | CRUD `service-types` |
| Доступность | CRUD `weekly-rules`, `windows`, GET `availability?from&to` |
| Заявки | GET/PATCH `requests`, POST public `requests`, **PATCH public cancel** (своя заявка) |
| Настройки | GET/PATCH `settings`, POST `settings/link-chat` |

### Лимиты заявок (PRD-03a, 2026-06-01)

| Правило | Поведение |
|---|---|
| Одна кличка | Нельзя две активные заявки на **ту же услугу + дату** с одинаковым именем питомца |
| Слот (`time_slots`) | Нельзя две заявки на **тот же слот** (услуга+дата+время) |
| На услугу в день | По умолчанию **1** при `time_slots`, иначе **2**; переопределение в `rules.limits.max_active_per_user_per_date` |
| На все услуги в день | По умолчанию **5**; `rules.limits.max_active_per_user_per_day` |

Ошибки API — понятные сообщения на русском (дубликат клички, слот занят, лимит).

---

## Подфазы разработки

### B1 — Справочник + роль manager

- [x] Миграция `013_booking` (таблицы услуг + settings)
- [x] Роль `manager` в users + middleware
- [x] Admin: CRUD услуг
- [x] Docs: `roles.md`, `data-model.md`

### B2 — Расписание и ёмкость

- [x] Миграция `014_booking_schedule`
- [x] Weekly rules + windows + overrides + day_staff API
- [x] GET availability (горизонт из settings)
- [x] Admin: вкладка «Расписание» в `/booking` (шаблон + окна + календарь) + mobile `< sm`

### B3 — Заявки

- [x] Миграция `015_booking_requests`
- [x] POST/PATCH requests, резерв при pending, освобождение при reject/cancel
- [x] GET availability учитывает booked_slots
- [x] PRD-03a антиспам v1 (2026-05-31)
- [x] PRD-03a v2: кличка, слот, настраиваемые лимиты в `rules` (2026-06-01)
- [x] Admin: вкладка «Заявки» в `/booking`
- [x] Public POST `/api/clinics/{slug}/booking/requests` (для C1)

### B4 — Бот: чат + клиент

- [x] Привязка `staff_chat_id` (`/link_staff` + admin settings)
- [x] Посты в группу/канал врачей
- [x] Личные уведомления клиенту

### C1 — Mini App

- [x] CTA «Записаться», услуга → дата → **время** (`schedule_style=time_slots`) → форма
- [x] «Мои заявки», pending vs confirmed, **отмена** своей заявки
- [x] Маска телефона, валидация, toast сверху, `rules` (возраст)
- [ ] Prod smoke после deploy app

### B5 — Polish

- [ ] Тесты: capacity, pending reserve, tenant isolation
- [x] Admin UX: единый `/booking`, «Сохранить шаблон», confirm/reject с текстом
- [x] Услуга: лимиты, возраст, тексты; расписание без «Мест» для time_slots
- [ ] **ADM-02** — форма создания заявки в admin
- [x] Инструкция для клиники (HTML-портал sync 2026-06-01)

---

## Бот (текущее состояние)

В prod Reply-меню + Menu Button «Открыть» → Mini App. Команда **`/link_staff`** — привязка чата врачей. Уведомления staff/клиенту: **дата + время** при `slot_time` (после deploy server).

---

## Зависимости

| ID | Связь |
|---|---|
| PRD-05 (баннер) | не блокирует |
| PRD-06 (mobile) | та же модель заявок |
| M0 `telegram_users` | ✅ в prod |
| Груминг | отдельный домен |

---

## Оценка (1 разработчик)

| Этап | Срок |
|---|---|
| B1 | ~3–4 дня |
| B2 | ~4–5 дней |
| B3 | ~3–4 дня |
| B4 | ~2–3 дня |
| C1 | ~4–5 дней |
| **Итого до MVP в prod** | **~3 нед** |

---

## Следующий шаг

1. Push `dev` → deploy **server** (BOOK-01, 016, лимиты, бот) + **app** (C1) + **admin**
2. VPS: миграция **016**; smoke: УЗИ по времени, 2 кота (разные клички), отмена, confirm/reject
3. **ADM-02** — заявка из admin; backlog — очередь на освободившийся слот

## Отладка prod (2026-05-31)

| Симптом | Частая причина |
|---|---|
| Календарь / POST заявки → 500 | Лог: `column d.name does not exist` → в SQL должно быть `d.full_name` ([BOOK-01](./context/ISSUES.md)) |
| Сообщение про миграции 013–015 в admin | Общий fallback; смотреть лог `docker compose logs app` и Network |
| Календарь пустой, без ошибки | Нет открытых дней в шаблоне или не нажато «Сохранить шаблон» |
| Заявок нет — календарь должен работать | `booked_slots = 0`; заявки не обязательны |

Календарь **не зависит** от наличия заявок в БД.
