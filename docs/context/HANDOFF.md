# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-06-10 (контент mobile + ЛК + admin «Приложение»)

### Prod / smoke

| Проверка | Результат |
|---|---|
| TG + VK auth на APK | ✅ (deploy + smoke пользователя) |
| Статьи / врачи / расписание / груминг | ✅ в APK (mobile API) |
| Вопрос из APK → ответ в боте | ✅ (нужен привязанный TG) |
| Личный кабинет: имя + фото | ✅ в коде; **миграция 021** — deploy server |
| Admin «Обзор» → вкладка «Приложение» | ✅ в коде; deploy admin |

### Сделано

**Mobile (`apps/mobile`)**
- [x] Контент до записи: статьи, врачи, расписание, груминг, «Задать вопрос»
- [x] **Личный кабинет** `/profile`: имя, фото (сжатие JPEG перед upload), привязка TG
- [x] «Ещё»: аватар, ссылка в ЛК

**Server**
- [x] `POST /api/mobile/v1/clinics/{slug}/questions` (JWT + TG)
- [x] `GET/PATCH /api/mobile/v1/profile`, `POST …/profile/photo`
- [x] Миграция **021** — `mobile_users.photo_url`
- [x] `GET /api/admin/stats/mobile/summary|users`

**Admin**
- [x] «Обзор»: вкладки **Mini App** | **Приложение** (список `mobile_users`)

### Деплой (если ещё не на prod)

1. **Server** — миграции **020–021**, profile + mobile questions + admin mobile stats
2. **Admin** — вкладка «Приложение»
3. APK: `npm run build` → `npx cap sync android`

### Следующий шаг

1. **Mobile sprint 5** — booking flow (`/booking/new`, «Мои заявки»)
2. UI-полировка mobile — после логики записи
3. **ADM-02**, C1 smoke Mini App
4. Backlog: Q&A без TG (inbox в приложении) · staff-режим в APK — не v1

### Сборка APK

`npm run build` → `npx cap sync android` → Android Studio. Версия в `build.gradle`.

### Ссылки

- [phase-5-appointments.md](../md/phases/phase-5-appointments.md) · [booking-for-clinic.html](../html/booking-for-clinic.html)
- [design-mvp.md](../md/mobile/design-mvp.md)
