# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-06-10 (Mobile auth: TG ✅, VK почти, профиль в «Ещё»)

### Ветка / деплой

Локальные изменения в **`work-mobile`** (и связанные правки server/mobile/app). **Merge в `dev` + Deploy server** нужны для:

- миграция **020**, `/auth/vk`, фикс `user_info` (`client_id`)
- `apps/app/public/vk-callback.html` на prod (мост VK → APK)
- CORS `https://localhost` (опционально для WebView)

### Сделано

**Mobile auth (APK на телефоне)**
- [x] **Telegram OTP** — работает: `CapacitorHttp`, фикс `setTokens` в `VerifyScreen` (без него сбрасывало на login)
- [x] **VK ID** — до экрана разрешений; redirect через `https://app…/vk-callback.html` → deep link в APK; `@capacitor/browser`
- [x] Новое **Web-приложение VK** (старый `54639803` был `DELETED` в API VK)
- [x] Экран **«Ещё»**: профиль пользователя + **Выйти**; на «Записи» — «Вы вошли как …»

**Server**
- [x] `FetchUserInfo`: добавлен **`client_id`** в `POST /oauth2/user_info` + fallback на `user_id` из токена
- [x] CORS: `localhost:5175`, `https://localhost` (для dev/APK)

**Инфра / docs**
- [x] `vk-callback.html` в `apps/app/public/` (HTTPS-мост для VK Web-приложения)
- [x] Портал: phase-5 + booking-for-clinic — канал **мобильное приложение**

### Prod / smoke (пользователь)

| Проверка | Результат |
|---|---|
| TG: код в бот → verify → вход | ✅ |
| VK: форма разрешений | ✅ |
| VK: после redirect → профиль | 🟡 «не удалось получить профиль VK» → **фикс server, ждёт deploy** |
| Экран «Ещё» / выход | ✅ после фикса verify |

### Блокеры / следующий шаг

1. **Push `dev` → Deploy server** (обязательно: `vkid/client.go` + `user_info`)
2. Убедиться: `vk-callback.html` на prod (`deploy-app` после push)
3. **VK кабинет (Web):** базовый домен `app.snzbeachvolleyball25.ru`, redirect `https://app.snzbeachvolleyball25.ru/vk-callback.html`, живой `VK_APP_ID` / secret на VPS и в `.env.local`
4. Пересборка APK: `npm run build` → `npx cap sync android`
5. Smoke VK end-to-end после deploy server

### Дальше по продукту

1. Mobile **sprint 2** — статьи (`/animals`)
2. Mobile **sprint 5** — booking flow (запись в APK)
3. Admin: вкладка **«Приложение»** в «Обзор» (`mobile_users`) — обсуждено, не в коде
4. **ADM-02**, C1 smoke Mini App

### Сборка APK (напоминание)

- Имя: `appName` в `capacitor.config.ts` → `npx cap sync`
- Версия: `versionCode` / `versionName` в `android/app/build.gradle`
- Иконка: Android Studio → Image Asset → `ic_launcher`
- Всегда: `npm run build` → `cap sync` перед APK

### Ссылки

- Запись: [phase-5-appointments.md](../md/phases/phase-5-appointments.md) · [booking-for-clinic.html](../html/booking-for-clinic.html)
- Mobile: [design-mvp.md](../md/mobile/design-mvp.md) · [rustore-guide.md](../md/mobile/rustore-guide.md)
