# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-06-01 (C1 polish, вопросы клиентам, доки)

### Сделано в коде (push `dev` → deploy)

**Mini App — запись (C1)**
- [x] Отмена заявки — фикс 500 (`handled_by_user_id` при отмене клиентом)
- [x] Слоты на **сегодня**: не показывать прошедшее время
- [x] «Мои заявки»: вкладки **Активные** / **Архив**

**Mini App — вопросы (новое)**
- [x] Карточка «Задать вопрос» на главной → форма → `POST …/questions`
- [x] Ответ врача: уведомление в **тот же чат** (`staff_chat_id`), кнопка «Ответить» или **reply** на сообщение бота → ответ клиенту в личку

**Server**
- [x] Миграция **017** `client_questions`
- [x] API `POST /api/clinics/{slug}/questions` (initData, лимит 5/день, 10–2000 символов)
- [x] Бот: `qreply` callback, ожидание текста врача в чате (15 мин)

**Документация**
- [x] `передача портал запись` — context + phase-5 md/html + booking-for-clinic.html

### Деплой

Push `dev` → **Deploy server**, **Deploy app** (admin без изменений, если paths не задели).

На VPS после server: миграции **016** (если ещё нет) и **017**.

BotFather: **Group Privacy → Disable** (reply врача в группе).

Smoke:
1. Запись: отмена, слоты на сегодня, вкладки заявок
2. Вопрос: Mini App → чат врачей → «Ответить» → ответ в личку клиента
3. Admin/booking без регрессии

### Следующая сессия

1. Prod smoke после деплоя (C1 + вопросы)
2. **ADM-02** — форма заявки в admin (backlog)
3. Очередь на освободившийся слот (backlog phase-5)
4. Опционально: история вопросов в Mini App; admin-список вопросов

### Правило admin UI

Эталон: `BookingScreen`, `GroomingScreen` — `< sm`: карточки, `fullScreen` диалоги, scrollable tabs.

---

## Фаза 5

[phase-5-appointments.md](../phase-5-appointments.md) · [booking-for-clinic.html](../booking-for-clinic.html)
