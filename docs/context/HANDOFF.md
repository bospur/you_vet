# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-06-09 (admin: врачи, запись, пользователи)

### Сделано в коде (ветка `work-bugs` → merge `dev` → **Deploy admin**)

**Пользователи**
- [x] Создание пользователя: автогенерация пароля (8 символов), кнопки «сгенерировать» и «скопировать»

**Врачи**
- [x] Загрузка фото: multipart через `fetch` (не axios), сжатие HEIC/больших снимков (`prepareImageForUpload`), на мобильном — всегда JPEG ≤ ~1.8 МБ
- [x] Отпуск: блок «С» / «По» → исключения `is_day_off` на каждый день диапазона
- [x] То же сжатие для логотипа/баннера в «Инфо клиники»

**Запись — услуги (B1 admin)**
- [x] Фикс «Создать услугу»: `reset()` подставлял поля правил в camelCase → валидация молча падала
- [x] Safari: label outlined-полей не залипает на бордере (shrink + фон у label)

**Прочее**
- Admin в Chrome у заказчика не открывался — ложная тревога; Safari и телефон OK

### Деплой

Только **Deploy admin** (`apps/admin/**`). Server/app без изменений.

Smoke (проверено заказчиком):
1. Пользователи → создать с автопаролем
2. Врач → фото с **телефона** (сжатие → загрузка)
3. Врач → отпуск по датам
4. Запись → Услуги → создать/сохранить

### Следующая сессия

1. Merge `work-bugs` → `dev` если ещё не в `dev`
2. **ADM-02** — форма создания заявки в admin (backlog)
3. Очередь на освободившийся слот (backlog phase-5)
4. Prod smoke C1 + вопросы (если ещё не закрыто с 2026-06-01)
5. Опционально: история вопросов в Mini App; admin-список вопросов

### Правило admin UI

Эталон: `BookingScreen`, `GroomingScreen` — `< sm`: карточки, `fullScreen` диалоги, scrollable tabs.

Загрузка файлов в admin: `prepareImageForUpload` + `postFormData` (`fetch`), не axios multipart.

---

## Фаза 5

[phase-5-appointments.md](../md/phases/phase-5-appointments.md) · [booking-for-clinic.html](../html/booking-for-clinic.html)
