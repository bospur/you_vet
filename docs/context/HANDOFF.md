# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-05-31 (B2 расписание)

**Ветка:** `work-F-5` · B1 в prod

### B2 (код готов, ждёт деплой)

- [x] Миграция `014_booking_schedule`
- [x] API: weekly-rules, windows, day-overrides, availability, settings
- [x] Admin: **Запись · расписание** (`/booking/schedule`)

### Следующая сессия

1. **Деплой B2:** server + admin (миграция 014)
2. Настроить кастрацию: вт/чт, 10 мест, 12–13 / забор 17:00 (открыть «Кастрация кота» — общий `cat_surgery`)
3. **B3:** `booking_requests`, резерв, антиспам PRD-03a

### Backlog

- Антиспам слотов — B3
- Очередь на освободившийся слот — позже
- PRD-05 баннер

---

## Фаза 5

| Этап | Статус |
|---|---|
| B1 | ✅ prod |
| B2 | код → деплой |
| B3 | заявки |
| B4 | бот |
| C1 | Mini App |

[phase-5-appointments.md](../phase-5-appointments.md) · [booking-for-clinic.html](../booking-for-clinic.html)
