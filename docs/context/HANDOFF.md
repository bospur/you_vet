# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-05-31 (B3–B4 + UX «Запись»)

### Сделано в коде (ожидает деплой)

**B3 — заявки**
- Миграция `015_booking_requests`
- API: GET/POST/PATCH `/api/admin/booking/requests`, public POST `/api/clinics/{slug}/booking/requests`
- Резерв ёмкости (pending + confirmed), антиспам PRD-03a
- Календарь: `booked_slots` / `remaining`

**B4 — бот**
- `/link_staff` в группе/канале → `staff_chat_id`
- Уведомления в staff-чат + клиенту (если `telegram_user_id`)
- API: `POST /api/admin/booking/settings/link-chat`, PATCH `staff_chat_id` / `clear_staff_chat`

**Admin UX**
- Один раздел **«Запись»** → `/booking` с вкладками: Услуги · Расписание · Заявки · Настройки (admin)
- Старые URL `/booking/services` и т.д. → редирект на `?tab=`
- Расписание: явная кнопка **«Сохранить шаблон»**, горизонт — кнопка «Сохранить» после изменения
- Календарь: ошибки API, подсказка «сначала сохраните шаблон»

### Деплой — чеклист

1. Push на `dev` → CI → миграции **013–015** на prod
2. Admin: **Запись → Расписание** — услуга, дни, **Сохранить шаблон**
3. Канал: `/link_staff` → **Запись → Настройки → Обновить статус**
4. Тестовая заявка: консоль браузера (admin) или confirm/reject в **Заявки** → сообщение в канал

### Тестовая заявка (консоль, admin)

```javascript
fetch('https://api.snzbeachvolleyball25.ru/api/admin/booking/requests', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service_type_id: 1,
    requested_date: 'YYYY-MM-DD', // открытый день из календаря
    client_name: 'Тест',
    client_phone: '+79001234567',
    pet_name: 'Мурзик',
  }),
}).then(r => r.json()).then(console.log);
```

Форма создания заявки в admin — **backlog** (пока только API).

### Следующая сессия — C1

1. Mini App: CTA «Записаться», услуга → дата → форма
2. «Мои заявки»

### Backlog

- Admin: форма ручного создания заявки
- Очередь на освободившийся слот
- PRD-05 баннер

### Правило для AI (admin UI)

Эталон: `BookingScreen`, `GroomingScreen` — `< sm`: карточки, `fullScreen` диалоги, scrollable tabs.

---

## Фаза 5

[phase-5-appointments.md](../phase-5-appointments.md) · [booking-for-clinic.html](../booking-for-clinic.html)
