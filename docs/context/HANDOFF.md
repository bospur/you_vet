# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-06-09 (Mobile «Ветпрактика», M0+M1, docs-портал)

### Сделано в коде (локально — **ждёт push `dev`**)

**Mobile — проектирование (`docs/md/mobile/`)**
- [x] `design-mvp.md` — scope RuStore v1, IA, UI-kit, auth, API M0, структура monorepo
- [x] `screen-specs.md` — 21 экран (wireframes, API, навигация)
- [x] `app-id-and-stores.md` — обучение: appId, RuStore, keystore
- [x] `multi-tenant-notes.md` — 1 клиника/сборку, задел SaaS
- [x] Решения: название **Ветпрактика**, appId `ru.snzbeachvolleyball25.vetpraktika`, запись в v1.0

**Server — M0 mobile API**
- [x] Миграция **019** `mobile_users`, `auth_codes`
- [x] `POST /api/mobile/v1/auth/{request,verify,refresh}`
- [x] `GET /api/mobile/v1/clinics/{slug}/…` — без initData, rate limit
- [x] Booking GET/POST/PATCH через **mobile JWT** (`ClientTelegramUserID`)
- [x] Бот: `/start link`, `OnContact`, `SendAuthCode` (OTP в TG)
- [x] `JWT_MOBILE_SECRET` (fallback → `JWT_SECRET`)

**Mobile app — M1 sprint 1 (`apps/mobile/`)**
- [x] Capacitor 7 + Vite + React 18, `capacitor.config.ts`
- [x] Shell: splash, tab bar, AppBar, главная (clinic-info), booking hub (soft gate)
- [x] API client → `/api/mobile/v1`, auth context + token storage
- [x] CI: build `@you-vet/mobile` в `ci.yml`

**Инфра / docs**
- [x] Восстановлен **docs.snzbeachvolleyball25.ru** на новом VPS (`213.176.65.71`) — nginx + certbot
- [x] `docs-portal-restore.md`, обновлён `deployment.md`
- [x] `html/mobile.html` — MVP + appId (портал)

### Деплой

Push `dev` → **Deploy server** (миграция **019**, mobile API, бот).  
**Deploy app/admin** — только если трогали paths (в этой сессии — нет).

На VPS после server: миграция **019**.

Проверить **GitHub Secret `VPS_HOST`** = `213.176.65.71` (если ещё старый IP — CI docs/admin/app не попадут на новый хост).

Smoke mobile API (после deploy):
1. Бот: `t.me/VPract_bot?start=link` → поделиться контактом
2. `POST /api/mobile/v1/auth/request` `{ "phone": "+79…" }` → код в TG
3. `POST …/auth/verify` → JWT
4. `GET …/clinics/default/clinic-info` без auth
5. `GET …/booking/requests` с `Authorization: Bearer …`

Локально mobile: `npm run dev --workspace=@you-vet/mobile` → http://localhost:5175

### Следующая сессия

1. Push `dev` + deploy server (019) + smoke auth
2. Mobile **sprint 2** — статьи (animals → articles → article) + «Ещё»
3. Mobile **sprint 4** — auth screens (login / verify / link-telegram) — можно раньше booking
4. Параллельно backlog: prod smoke C1+вопросы (если ещё не закрыто), **ADM-02**

### Правило admin UI

Эталон: `BookingScreen`, `GroomingScreen` — `< sm`: карточки, `fullScreen` диалоги, scrollable tabs.

---

## Фаза 5 + Mobile

- Запись: [phase-5-appointments.md](../md/phases/phase-5-appointments.md)
- Mobile: [design-mvp.md](../md/mobile/design-mvp.md) · [screen-specs.md](../md/mobile/screen-specs.md) · [mobile.html](../html/mobile.html)
