# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-05-31 (B4 — бот + уведомления)

### Сделано

- **`/link_staff`** в группе/канале — привязка `staff_chat_id` в `booking_settings`
- **Admin** `/booking/settings` — статус привязки, инструкция, ручной Chat ID, отвязка
- **API:** `POST /api/admin/booking/settings/link-chat`, PATCH `staff_chat_id` / `clear_staff_chat`
- **Уведомления staff-чат:** новая заявка, confirm/reject/cancel/reschedule
- **Уведомления клиенту** в личку (если есть `telegram_user_id`)

### Как привязать чат (prod)

1. Бот @VPract_bot — админ канала/группы с правом публиковать
2. Опубликовать в канале: `/link_staff`
3. Admin → «Запись · настройки» → «Обновить статус»

### Следующая сессия — C1

1. Mini App: CTA «Записаться», выбор услуги → дата → форма
2. «Мои заявки»

### Backlog

- Очередь на освободившийся слот
- PRD-05 баннер
- Admin: ручное создание заявки (форма)

---

## Фаза 5

[phase-5-appointments.md](../phase-5-appointments.md) · [booking-for-clinic.html](../booking-for-clinic.html)
