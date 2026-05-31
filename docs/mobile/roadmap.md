# Мобильное приложение — roadmap

> Фреймворк: Capacitor · Обновлено: 2026-05-30

## Монорепо или отдельная репа?

**Рекомендация: держать в текущем монорепо** (`apps/mobile/`).

| Критерий | Монорепо ✅ | Отдельная репа |
|---|---|---|
| `@you-vet/types` | npm workspace, одна версия | publish / git submodule |
| API-контракт | PR server + mobile вместе | рассинхрон |
| CI/CD | path-based deploy, общий `ci.yml` | второй pipeline |
| Миграции auth | server + mobile в одном PR | координация вручную |
| Размер репы | +Capacitor ios/android folders | чище, но дороже sync |

**Отдельная репа** имеет смысл, если: другая команда, другой release cycle, white-label для N клиник с форком UI.

**Структура в монорепо:**

```
apps/mobile/
  src/              ← React (Vite)
  capacitor.config.ts
  ios/              ← генерируется cap add ios (git)
  android/          ← генерируется cap add android (git)
  package.json
```

Turborepo: добавить `mobile` в workspaces + task `build`. Deploy mobile — **не** scp как SPA: сборка в CI → RuStore / App Store Connect (отдельный workflow позже).

---

## Фазы

### Фаза M0 — Backend mobile API (1–2 нед)

- [ ] Миграция: `mobile_users` (`phone`, `telegram_chat_id`, `created_at`)
- [ ] Миграция: `auth_codes` (OTP hash, TTL)
- [ ] `GET /api/mobile/v1/clinics/{slug}/...` — те же handlers, без initData
- [ ] Rate limit на mobile routes
- [ ] Bot: handler contact → привязка phone ↔ chat_id
- [ ] `POST auth/request`, `POST auth/verify`, `POST auth/refresh`

### Фаза M1 — Capacitor shell + read-only (3–4 нед)

- [ ] `npx create` / `cap init` в `apps/mobile`
- [ ] Vite + React 18 + React Router + TanStack Query
- [ ] Подключить `@you-vet/types`
- [ ] Экраны: главная, статьи, врачи, расписание, груминг (parity с Mini App)
- [ ] Свой UI (не telegram-ui): tokens из `apps/app/src/styles/tokens.css`
- [ ] `tel:`, maps link на адрес
- [ ] Empty states, error screens
- [ ] Internal testing: Android debug APK, iOS TestFlight

**Capacitor setup:**

```bash
cd apps/mobile
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init
npm run build && npx cap sync
```

Документация: [Getting Started](https://capacitorjs.com/docs/getting-started)

### Фаза M2 — Auth + запись (2–3 нед, после PRD-03 / Фазы 5)

- [ ] Экраны login: телефон → код
- [ ] Onboarding: deeplink «Привязать Telegram» → бот
- [ ] JWT interceptor в axios
- [ ] Заявка на приём — **общий backend** с [phase-5-appointments.md](../phase-5-appointments.md) (`appointment_requests`)
- [ ] Push: `@capacitor/push-notifications` + FCM/APNs

### Фаза M2.5 — Карточка клиента (после MVP бота + метрик)

> Зависит от PRD-09. Сначала — бот и Mini App; mobile — когда есть трафик и понятна идентификация клиента.

- [ ] Экран «Моя карта»: штрихкод + имя/номер карты (данные из БД клиники через backend-коннектор)
- [ ] Общий API с ботом: `GET /api/.../client-card` (по телефону / JWT / Telegram chat_id)
- [ ] Offline: кэш последней карты (опционально, M4)

Документация: [Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)

### Фаза M3 — Store release (2–4 нед параллельно)

- [ ] Privacy policy, terms (ветклиника, персональные данные)
- [ ] Иконка, splash, скриншоты
- [ ] RuStore публикация
- [ ] Google Play (optional)
- [ ] App Store (TestFlight → production)
- [ ] CI: `mobile-build.yml` (build + upload artifacts)

Ссылки: [RuStore Help](https://www.rustore.ru/help/developers), [Capacitor CI/CD](https://capacitorjs.com/docs/guides/ci-cd)

### Фаза M4 — Polish

- [ ] SMS OTP fallback
- [ ] «Мои заявки» в app
- [ ] Offline cache статей (Capacitor Filesystem / SQLite plugin)
- [ ] App attestation / certificate pinning
- [ ] Оптимизация bundle, замена тяжёлых assets

---

## Оценка сроков (1 разработчик)

| Scope | Срок |
|---|---|
| M0 + M1 (read-only app) | ~1.5–2 мес |
| M2 (auth + запись + push) | +1–1.5 мес |
| M3 (stores) | +2–4 нед |

Mini App и бот **не блокируются** — параллельные каналы.

---

## Зависимости от основного roadmap

| ID | Связь |
|---|---|
| PRD-03 | Запись — модель `appointment_requests` из [phase-5-appointments.md](../phase-5-appointments.md) |
| PRD-04 | Аналитика — mobile client_id в events |
| PRD-09 | Карточка клиента — общий backend-коннектор к БД клиники; mobile после MVP бота |
| SEC-04 | Только admin; mobile JWT — отдельная схема |

---

## Следующий шаг

1. PR / design: структура `apps/mobile` в монорепо  
2. M0: `/api/mobile/v1` + bot contact handler  
3. M1: 4 экрана + internal APK
