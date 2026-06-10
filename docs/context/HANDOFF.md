# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-06-10 (mobile UX + auth + splash + admin delete user)

### Prod / smoke

| Проверка | Результат |
|---|---|
| Deploy пользователя (server/admin/mobile) | ✅ пользователь подтвердил |
| CI lint mobile (`ProfileScreen` setState in effect) | ✅ исправлено в коде |
| APK: splash с картинкой клиники | ✅ в коде; `cap sync` + rebuild |
| APK: гостевой режим / вход / ЛК | 🟡 smoke после push |

### Сделано

**Mobile (`apps/mobile`) — UI/UX**
- [x] Убрана кнопка «Назад» в `NestedAppBar` (системная навигация)
- [x] Профиль в хедере; для гостя — иконка входа
- [x] Убрана sticky «Позвонить» на главной (звонок в хедере)
- [x] Адаптация **365px / 320px**
- [x] ЛК: progress при загрузке фото, ✓ в инпуте имени, тема светлая/тёмная
- [x] Главная: коллапс «О нас» (`HomeClinicBlock`), баннер для гостей
- [x] Меню: «Запись» и «Вопрос» скрыты без auth
- [x] Иконки меню как в mini app (`react-icons/fa6`)
- [x] Врачи: сетка 2×N с крупным фото
- [x] Экран входа — полноэкранный (VK + телефон, «Продолжить без входа»)
- [x] «Ещё» упрощён (без дубля аккаунта; выход / подсказка)

**Mobile — splash**
- [x] Нативный launch screen + веб `/splash` с фоном `src/assets/splash-bg.png`
- [x] `SplashScreen` plugin: `launchAutoHide: false`, hide при монтировании React

**Mobile — auth/session**
- [x] Refresh JWT (`/auth/refresh`) в `authenticatedFetch` + axios interceptor
- [x] При 401 → clear tokens → редирект на `/auth/login` с защищённых маршрутов

**Server**
- [x] `DELETE /api/admin/stats/mobile/users/{id}` — удаление mobile user
- [x] Профиль удалённого user → **401** (не 404)

**Admin**
- [x] «Обзор» → «Приложение»: кнопка удаления пользователя + confirm

**Fix**
- [x] Android build: дубликат `ic_launcher_background` в `colors.xml`

### Деплой (после push `dev`)

1. **Server** — delete mobile user + 401 profile
2. **Admin** — delete в табе «Приложение»
3. **Mobile APK** — `npm run build` → `npx cap sync android`

### Следующий шаг

1. **Mobile sprint 5** — booking flow (`/booking/new`, «Мои заявки»)
2. Smoke: удаление user в admin → 401 в APK → экран входа
3. **ADM-02**, C1 smoke Mini App

### Сборка APK

`npm run build` → `npx cap sync android` → Android Studio (**Clean Project** после смены `res/`).

### Ссылки

- [design-mvp.md](../md/mobile/design-mvp.md)
- [phase-5-appointments.md](../md/phases/phase-5-appointments.md)
