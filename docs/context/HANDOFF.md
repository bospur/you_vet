# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-06-10 (Mobile auth: VK ID + APK, docs-портал)

### Ветка

**`work-mobile`** — merge в **`dev`** обязателен для prod (VK `/auth/vk`, миграция **020**, фикс кнопки бота).

Коммиты (верх ветки):
- `488e40b` — LoginScreen (VK + телефон), Verify, LinkTelegram, `POST /auth/vk`, миграция 020
- `274d5e3` — бот: `menu.Reply` для кнопки «Поделиться номером»
- `8cca642` — docs-портал: `rustore-app.html`, roadmap, без design-brief/аналитики

### Сделано

**Server**
- [x] Миграция **020** — `vk_user_id`, `mobile_user_id` в booking
- [x] `POST /api/mobile/v1/auth/vk` — обмен code VK → JWT (`VK_APP_ID`, `VK_APP_SECRET`, `VK_REDIRECT_URI`)
- [x] Booking list/cancel по `mobile_user_id` (VK без Telegram)
- [x] Фикс бота: кнопка контакта при `/start link` (был пустой `reply_markup`)

**Mobile (`apps/mobile/`)**
- [x] Экран **Вход**: VK ID (`@vkid/sdk`) + телефон/OTP/TG
- [x] `/auth/verify`, `/auth/link-telegram`
- [x] Первый **debug APK** на телефон пользователя (shell работает)

**Docs-портал** (push в `dev` — выкатился)
- [x] `html/rustore-app.html`, обновлённые index + roadmap
- [x] `CODEWORDS.md` — маршрут `rustore`

**VPS (пользователь)**
- [x] `VK_APP_*` добавлены в `/home/deploy/you_vet/apps/server/.env`
- [x] `docker compose up -d --force-recreate app` (ручной `pull` → `denied` без GHCR login — нормально)

### Prod / проверки

| Проверка | Результат |
|---|---|
| `GET …/clinic-info` | ✅ 200 |
| `POST …/auth/request` | ✅ (PHONE_NOT_LINKED если не привязан) |
| `POST …/auth/vk` | 🟡 после deploy — **не 404** (ожидаем 400/401 на фейковом code) |
| VK вход в APK | 🔴 «Не удалось войти» — см. блокеры ниже |

### Блокеры (следующая сессия)

1. **`work-mobile` → `dev`** + зелёный **Deploy server** (020, `/auth/vk`, фикс бота)
2. **`VITE_VK_APP_ID`** в `.env.local` — только **числовой ID** из кабинета VK, не защищённый ключ  
   (было `fNnR7akAtHzjNczMNCrB` — неверно)
3. **APK:** перед Build APK всегда `npm run build` → `npx cap sync android`  
   (без sync в APK попадает старый JS — «sprint 4» на экране входа)
4. Удалить старое приложение на телефоне → установить новый APK

### Smoke VK (после merge + APK)

1. Запись → Записаться → **Войти через VK ID**
2. Или телефон: бот `?start=link` → контакт → код в TG
3. `curl -X POST …/auth/vk` — не `404`

### Следующая сессия

1. Merge `work-mobile` → `dev`, deploy server, проверить `/auth/vk`
2. Исправить `VITE_VK_APP_ID`, пересобрать APK
3. Smoke VK login на телефоне
4. Mobile **sprint 2** — статьи (animals → articles)
5. Backlog: **ADM-02**, C1 smoke

### Правило admin UI

Эталон: `BookingScreen`, `GroomingScreen` — `< sm`: карточки, `fullScreen` диалоги, scrollable tabs.

### Ссылки

- Запись: [phase-5-appointments.md](../md/phases/phase-5-appointments.md)
- Mobile: [design-mvp.md](../md/mobile/design-mvp.md) · [rustore-guide.md](../md/mobile/rustore-guide.md) · [rustore-app.html](../html/rustore-app.html)
