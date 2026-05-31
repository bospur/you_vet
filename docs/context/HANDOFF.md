# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-05-31 (отладка prod «Запись» + admin UX + CI)

### Диагностика prod (VPS)

Симптомы: календарь 500, `POST /api/admin/booking/requests` 500. В admin — общее сообщение про миграции 013–015.

**Реальная причина (логи `docker compose logs app`):**
```text
pq: column d.name does not exist
```
В `loadScheduleData` JOIN `doctors` использовал `d.name`; в схеме поле — **`full_name`**.

**Фикс в коде:** `apps/server/internal/repository/booking_schedule.go` — `d.full_name`.

Миграции на prod в порядке (контейнер `app` Up, таблицы booking есть). Путать с отсутствием `booking_requests` не нужно.

### Сделано в коде (нужен push → Deploy server + admin)

**Server**
- [x] `d.name` → `d.full_name` в запросе `booking_day_staff`

**Admin**
- [x] CI: убран `setState` в `useEffect` в `BookingSchedulePanel`; сравнение черновика шаблона с сервером + подсказки, почему «Сохранить шаблон» неактивна
- [x] Календарь: текст ошибки из ответа API (`bookingApiErrorMessage`), не только «миграции»
- [x] Заявки: фильтр «Услуга» — `FormControl` + `Select` (был сжат ~20px)
- [x] `weeklyDraft.ts`, `bookingApiError.ts` в `modules/booking/domain/`
- [x] `ServiceTypeFormDialog`: lint `watch` в deps

**CI**
- Падал **lint admin** (`react-hooks/set-state-in-effect`); deploy admin/server **не ждут** CI — поэтому код на prod мог быть, а CI красный.
- После правок: `npm run lint` — 0 errors.

### Prod после фикса server

```bash
cd ~/you_vet/apps/server
docker compose pull app && docker compose up -d app
docker compose logs app --tail 20   # без d.name
```

Проверка: **Запись → Расписание → Календарь**; тестовая заявка (ниже).

### Тестовая заявка (консоль, admin)

Дата — **открытый день из календаря**; `service_type_id` — из **Запись → Услуги** или `GET .../service-types`.

```javascript
fetch('https://api.snzbeachvolleyball25.ru/api/admin/booking/requests', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service_type_id: 1,
    requested_date: 'YYYY-MM-DD',
    client_name: 'Тест Иванов',
    client_phone: '+79001234567',
    pet_name: 'Мурзик',
  }),
}).then(async (r) => {
  console.log(r.status, await r.text());
});
```

Форма в admin — **backlog** (ADM-02).

### Важно для AI / продукта

- **Календарь не требует существующих заявок** — только шаблон недели + горизонт; `booked_slots = 0` без записей.
- **Mini App запись (C1) не сделана** — в `apps/app` нет booking UI; API `POST /api/clinics/{slug}/booking/requests` готов под C1.

### Следующая сессия

1. Убедиться, что фикс `d.full_name` в prod; smoke: календарь, заявка, confirm → чат `/link_staff`
2. **C1** — Mini App: CTA «Записаться», услуга → дата → форма, «Мои заявки»
3. Backlog: форма заявки в admin, очередь на слот, PRD-05

### Правило admin UI

Эталон: `BookingScreen`, `GroomingScreen` — `< sm`: карточки, `fullScreen` диалоги, scrollable tabs.

---

## Фаза 5

[phase-5-appointments.md](../phase-5-appointments.md) · [booking-for-clinic.html](../booking-for-clinic.html)
