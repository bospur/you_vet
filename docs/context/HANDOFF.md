# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-05-31 (B2 + контекст + mobile admin)

**B1 + B2** в prod (по словам пользователя).

### Сделано в коде (после деплоя B2 — подтянуть admin)

- Улучшена **мобильная вёрстка** раздела «Запись»: scrollable tabs, fullWidth поля, fullScreen диалоги, карточки вместо таблицы (услуги), календарь 2 колонки на `< sm`.

### Следующая сессия — B3

1. `booking_requests` + резерв при `pending`
2. **PRD-03a** антиспам (лимит заявок на TG-user / день / услугу)
3. Admin «Заявки»

### Правило для AI (admin UI)

При любых новых экранах admin — **обязательно** `< sm`: карточки вместо таблиц, IconButton «Добавить», `useMediaQuery`, диалоги `fullScreen`, вкладки `variant="scrollable"`. Эталон: `GroomingScreen`, `BookingScheduleScreen`.

### Backlog

- Очередь на освободившийся слот
- PRD-05 баннер
- UI-02 NavGrid deferred

---

## Фаза 5

[phase-5-appointments.md](../phase-5-appointments.md) · [booking-for-clinic.html](../booking-for-clinic.html)
