# Фаза 5 — Запись на приём (PRD-03)

> Статус: **C1 + вопросы** · mobile: auth ✅, контент ✅, ЛК ✅, запись sprint 5 · Обновлено: **2026-06-10**  
> Для клиники (простым языком): [booking-for-clinic.html](../../html/booking-for-clinic.html)  
> Связанные документы: [roadmap.html](../../html/roadmap.html) · [roles.md](../general/roles.md) · [mobile/roadmap.md](../mobile/roadmap.md) · [rustore-guide.md](../mobile/rustore-guide.md)

## Суть (уточнено с клиникой)

Узкий MVP: запись только на **фиксированный каталог процедур** (УЗИ ×3, кастрация/стерилизация кошек, рентген). Не «любой врач / любая дата».

| Принцип | Решение |
|---|---|
| Каналы клиента v1 | **Mini App** (запись + вопрос); **«Ветпрактика»** (APK) — контент + вопрос (ответ в TG) + ЛК; **запись в APK** — sprint 5; бот — уведомления + чат врачей |
| Ёмкость | Слоты/места на день, гибко **по услуге** (шаблон недели + разовые окна) |
| Подтверждение | **На услугу:** `instant` или `pending`; при pending место **резервируется**, статус «ожидает подтверждения» |
| Горизонт | **2 недели** вперёд |
| Операции кошек | **Общая ёмкость** на день для кастрации + стерилизации (напр. 10 мест) |
| Ресурс | Кабинет/процедура; **врач дня** — опционально в admin |
| Staff | Роль **`manager`** (Менеджер) + **один групповой чат врачей** для уведомлений бота |
| Груминг | Отдельно, пересечения по времени **не проверяем** в v1 |

**Не входит в v1:** полная запись «на любого врача», **запись в mobile app** (только вход), RuStore релиз, автосдвиг очереди при отказе (см. backlog ниже).

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

См. [roles.md](../general/roles.md).

---

## Уведомления

1. **Групповой чат врачей** (один на клинику): бот — админ группы, `staff_chat_id` в настройках записи.
2. События в чат: новая заявка, подтверждение, отмена; **вопрос клиента** с кнопкой «Ответить».
3. **Клиенту в личку** от бота при смене статуса заявки и при **ответе на вопрос**.
4. Врач отвечает: нажать «Ответить» и написать в чат **или** reply на сообщение бота (нужен **Group Privacy off**).

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

### `client_questions` (миграция **017**)

Вопрос из Mini App: `telegram_user_id`, `client_name`, `text`, `status` (`open`|`answered`), `staff_reply`, `staff_chat_message_id` (для reply), лимит **5 вопросов/день** на пользователя.

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
| Вопросы | **POST** `/api/clinics/{slug}/questions` — текст 10–2000 символов, initData |
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
- [x] «Мои заявки»: вкладки **Активные** / **Архив**; **отмена** своей заявки (фикс FK `handled_by_user_id`)
- [x] На **сегодня** — не показывать прошедшие слоты времени
- [x] Маска телефона, валидация, toast сверху, `rules` (возраст)
- [ ] Prod smoke после deploy app

### Q1 — Вопрос клиента (2026-06-01)

- [x] Карточка «Задать вопрос» на главной, экран `/question`
- [x] POST `questions` → уведомление в `staff_chat_id`
- [x] Бот: inline «Ответить», reply на сообщение, ответ в личку клиента
- [ ] Prod smoke; backlog: история в Mini App, список в admin

### M-mobile — RuStore-приложение (PRD-06)

Отдельный канал; та же модель заявок, что Mini App (когда будет booking sprint 5).

| Что | Статус |
|---|---|
| Shell, tabs, главная | ✅ M1 |
| Вход Telegram OTP + VK ID | ✅ smoke на APK |
| Контент: статьи, врачи, расписание, груминг | ✅ parity с Mini App |
| Вопрос клиента | ✅ APK (ответ в Telegram-боте; нужна привязка TG) |
| Личный кабинет (имя, фото) | ✅ `/profile`, миграция **021** |
| Admin: пользователи APK | ✅ «Обзор» → вкладка «Приложение» |
| Запись на приём | ⏳ **sprint 5** (следующий) |
| RuStore | ⏳ M3 |

**VK кабинет:** тип **Web**, домен `app.snzbeachvolleyball25.ru`, redirect `https://app.snzbeachvolleyball25.ru/vk-callback.html`. Страница в `apps/app/public/` — статический хостинг на домене Mini App.

**Сборка APK:** `apps/mobile` → `npm run build` → `npx cap sync android`.

### B5 — Polish

- [ ] Тесты: capacity, pending reserve, tenant isolation
- [x] Admin UX: единый `/booking`, «Сохранить шаблон», confirm/reject с текстом
- [x] Услуга: лимиты, возраст, тексты; расписание без «Мест» для time_slots
- [ ] **ADM-02** — форма создания заявки в admin
- [x] Инструкция для клиники (HTML-портал sync 2026-06-01)

---

## Бот (текущее состояние)

В prod Reply-меню + Menu Button «Открыть» → Mini App. Команда **`/link_staff`** — привязка чата (заявки **и вопросы**). Уведомления заявок: **дата + время** при `slot_time`. Вопросы: `qreply:{id}` + текст врача в чате → клиенту «Ответ клиники».

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

1. Deploy **server** (**021** profile) + **admin** (вкладка «Приложение»), если не на prod
2. **Mobile sprint 5** — booking (`/booking/new`, «Мои заявки»)
3. **ADM-02**; C1 smoke Mini App; backlog — Q&A inbox без TG, очередь на слот

## Отладка prod (2026-05-31)

| Симптом | Частая причина |
|---|---|
| Календарь / POST заявки → 500 | Лог: `column d.name does not exist` → в SQL должно быть `d.full_name` ([BOOK-01](../../context/ISSUES.md)) |
| Сообщение про миграции 013–015 в admin | Общий fallback; смотреть лог `docker compose logs app` и Network |
| Календарь пустой, без ошибки | Нет открытых дней в шаблоне или не нажато «Сохранить шаблон» |
| Заявок нет — календарь должен работать | `booked_slots = 0`; заявки не обязательны |

Календарь **не зависит** от наличия заявок в БД.
