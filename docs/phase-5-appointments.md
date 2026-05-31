# Фаза 5 — Запись на приём (PRD-03)

> Статус: **спроектировано, разработка не начата** · Обновлено: 2026-05-31  
> Связанные документы: [roadmap.html](./roadmap.html) · [registration-phase-survey.html](./registration-phase-survey.html) · [mobile/roadmap.md](./mobile/roadmap.md)

## Суть

Клиент **оставляет заявку** (не автозапись). Клиника **видит очередь и реагирует**. Статус меняется → **бот уведомляет клиента** (и при необходимости врача).

**MVP-каналы:**

| Кто | Канал | Зачем |
|---|---|---|
| Клиент | Telegram-бот + Mini App | Создать заявку, «мои заявки» |
| Админ / регистратура | Admin «Заявки» | Очередь всех заявок, фильтры, действия |
| Врач | Бот (staff mode) | Push о новой заявке, быстрые действия |

**Не входит в MVP Фазы 5:** RuStore/mobile app, полноценный ЛК клиента, автоматическое бронирование слотов без участия клиники, отдельное приложение для врачей.

---

## Принципы (зафиксированы)

1. **Pending flow** — `pending → confirmed | rejected | rescheduled | cancelled_by_client`
2. **API v1** для нового домена — существующие `/api/clinics/...` и `/api/admin/...` не ломаем
3. **Идентификация клиента** — `telegram_user_id` (бот + Mini App initData); телефон — обязательное поле заявки
4. **Staff ≠ карточка врача** — связь `doctors.id ↔ telegram_user_id` или отдельная таблица `staff_telegram_users`
5. **Уведомления staff** — через бота (дешевле и быстрее, чем FCM/RuStore)
6. **Детали UX** — уточняются по [анкете](./registration-phase-survey.html) в следующей сессии

---

## Архитектура

```
Клиент (бот / Mini App)
    → POST /api/v1/clinics/{slug}/appointment-requests
    → telegram_users (уже есть)

Admin / API
    → GET/PATCH /api/v1/admin/appointment-requests
    → смена статуса → bot SendMessage клиенту

Staff-бот (whitelist TG id)
    → «Новые заявки», inline: принять / отклонить / перенести
    → уведомление при POST заявки (назначенному врачу или всем staff)
```

---

## Подфазы

### 5.0 — Вход (до кода)

- [ ] Получить ответы директора по анкете
- [ ] Зафиксировать: обязательные поля, выбор врача, горизонт записи, отмена клиентом
- [ ] Согласовать MVP scope (что режем, если сроки жмут)

**Выход:** финальный UX-flow (1–2 страницы сценариев).

---

### 5.1 — Backend + API v1 (~1 нед)

**Миграция `013_appointment_requests` (черновик):**

```sql
appointment_requests (
  id, clinic_id,
  telegram_user_id BIGINT,          -- nullable если заявка только по телефону (позже)
  doctor_id INT REFERENCES doctors, -- nullable = «любой свободный»
  client_name, client_phone,
  pet_name, pet_species, comment,
  preferred_date DATE, preferred_time TIME,  -- пожелание, не гарантия слота
  status VARCHAR,                   -- pending | confirmed | rejected | rescheduled | cancelled
  staff_note TEXT,                  -- комментарий при отклонении/переносе
  confirmed_at, handled_by_user_id,
  created_at, updated_at
)

staff_telegram_users (
  clinic_id, telegram_user_id, doctor_id NULL, role, -- doctor | admin_desk
  UNIQUE (clinic_id, telegram_user_id)
)
```

**API (новые роуты):**

| Метод | URL | Auth | Описание |
|---|---|---|---|
| POST | `/api/v1/clinics/{slug}/appointment-requests` | initData | Создать заявку |
| GET | `/api/v1/clinics/{slug}/appointment-requests/mine` | initData | Заявки текущего TG-пользователя |
| GET | `/api/v1/admin/appointment-requests` | admin JWT | Список + фильтры (status, doctor, date) |
| GET | `/api/v1/admin/appointment-requests/{id}` | admin JWT | Детали |
| PATCH | `/api/v1/admin/appointment-requests/{id}` | admin JWT | Смена status, staff_note, doctor_id |
| GET/POST/DELETE | `/api/v1/admin/staff-telegram` | admin | Whitelist staff для бота |

**Правила:**

- Tenant-scoping по `clinic_id` из JWT / slug
- Rate limit на POST заявки
- Валидация телефона (формат RU — уточнить в 5.0)

---

### 5.2 — Клиент: бот (~1 нед)

- [ ] Reply-кнопка «📅 Записаться» в главном меню
- [ ] FSM: врач (или «любой») → дата/время → имя → телефон → питомец → комментарий → подтверждение
- [ ] Команда `/my` или кнопка «Мои заявки» — список со статусами
- [ ] Отмена клиентом (если анкета разрешит) → `cancelled`
- [ ] После создания — сообщение «Заявка принята, ждите подтверждения»

---

### 5.3 — Клиент: Mini App (~3–5 дней)

- [ ] CTA «Записаться» на главной (после 5.2 или параллельно)
- [ ] Экран формы — parity с ботом, те же API
- [ ] Экран «Мои заявки»
- [ ] Empty/error states

---

### 5.4 — Staff: admin (~1 нед)

- [ ] Раздел `/appointments` в admin (admin + editor; groomer — нет)
- [ ] Таблица: дата создания, клиент, телефон, врач, пожелание, статус
- [ ] Фильтры: pending / все / по врачу
- [ ] Действия: подтвердить, отклонить (+ note), перенести (новая дата/время в staff_note или поля)
- [ ] Настройка staff Telegram IDs (привязка к врачу опционально)

---

### 5.5 — Staff: бот (~3–5 дней)

- [ ] При `/start` — если `telegram_user_id` в whitelist → staff-клавиатура
- [ ] «📥 Новые заявки» — список pending (с пагинацией)
- [ ] Карточка заявки + inline: ✅ Принять · ❌ Отказать · 📅 Перенести
- [ ] Push при новой заявке: «Новая заявка: Иван, кошка, завтра 10:00» → deep link в карточку
- [ ] Уведомление клиенту при смене статуса из admin или из бота staff

---

### 5.6 — Polish + деплой

- [ ] Тесты: repository, status transitions, tenant isolation
- [ ] Обновить `server/api.md`, `data-model.md`
- [ ] Деплой server → admin → app → проверка prod
- [ ] Инструкция для клиники: как добавить врачей в staff-бот

---

## Статусы заявки

| Статус | Кто ставит | Клиент видит |
|---|---|---|
| `pending` | автоматически | «Ожидает подтверждения» |
| `confirmed` | staff/admin | «Подтверждено на …» |
| `rejected` | staff/admin | «Отклонено» + причина (если есть) |
| `rescheduled` | staff/admin | «Перенесено на …» |
| `cancelled` | клиент или staff | «Отменено» |

---

## Зависимости и параллель

| ID | Связь |
|---|---|
| PRD-05 (баннер) | **Не блокирует** Фазу 5; можно после или параллельно |
| PRD-06 (mobile) | M2 использует **ту же модель** `appointment_requests` |
| M0 `telegram_users` | ✅ уже в prod — основа идентификации |
| SEC-* / техдолг | ✅ закрыт 2026-05-31 (кроме UI-02) |

---

## Оценка (1 разработчик)

| Подфаза | Срок |
|---|---|
| 5.0 анкета + UX | 2–3 дня (с клиникой) |
| 5.1 backend | ~1 нед |
| 5.2 бот клиент | ~1 нед |
| 5.3 Mini App | ~3–5 дней |
| 5.4 admin | ~1 нед |
| 5.5 staff бот | ~3–5 дней |
| **Итого MVP** | **~3–4 нед** после утверждения UX |

---

## Следующая сессия

1. Разобрать ответы анкеты (или пройти сценарии без анкеты — decision tree)
2. Уточнить поля БД и FSM бота под реальный процесс клиники
3. Начать **5.1** — миграция + POST/PATCH API
