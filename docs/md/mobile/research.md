# Мобильное приложение — аналитика и изучение возможностей

> Обновлено: 2026-05-30

## Контекст

Цель — **полноценное приложение в App Store / RuStore**, не зависящее от Telegram. Mini App и бот остаются отдельным каналом. Mobile app работает с **тем же бэкендом**.

Мотивация: риск блокировки или недоступности Telegram в РФ; иконка на экране, push-уведомления, доверие пользователей.

---

## Что уже есть на бэкенде

Публичные read-only эндпоинты (сейчас под `initData`):

| Эндпоинт | Данные |
|---|---|
| `GET .../clinic-info` | Название, телефон, адрес, баннер |
| `GET .../animals` | Животные |
| `GET .../animals/{slug}/articles` | Статьи |
| `GET .../articles/{slug}` | Статья (HTML) |
| `GET .../doctors` | Врачи |
| `GET .../schedule` | Расписание |
| `GET .../grooming/breeds`, `.../schedule` | Груминг |

Admin, бот, мутации — без изменений. Mobile client **не использует** TipTap, admin JWT, Telegram SDK.

**Блокер сегодня:** middleware `TelegramInitData` на `/api/clinics/...`. Mobile нужен **отдельный route group** или dual-auth middleware.

---

## Сравнение подходов к клиенту

| Подход | Срок до MVP | Переиспользование | Минусы |
|---|---|---|---|
| **Capacitor** ✅ выбран | 4–8 нед | ~70% логики из `apps/app`, `@you-vet/types` | UI без `@telegram-apps/telegram-ui` |
| React Native | 8–12 нед | types, API-слой | UI с нуля |
| PWA / веб | 1–2 нед | ~95% `apps/app` | слабый push на iOS, нет «настоящего» app |
| Kotlin + Swift | 4–6+ мес | только API | две кодовые базы |

### Почему Capacitor

- Один React-код → **iOS + Android**
- Встраивается в существующий монорепо (Vite, npm workspaces)
- Native API: push, камера, deep links — через [plugins](https://capacitorjs.com/docs/plugins)
- Не обязателен Ionic UI — можно свой дизайн
- Документация: [capacitorjs.com/docs](https://capacitorjs.com/docs)

### Полезные ссылки (Capacitor)

| Тема | URL |
|---|---|
| Главная | https://capacitorjs.com |
| Getting Started | https://capacitorjs.com/docs/getting-started |
| Installing in existing app | https://capacitorjs.com/docs/getting-started/with-ionic |
| iOS | https://capacitorjs.com/docs/ios |
| Android | https://capacitorjs.com/docs/android |
| Plugins | https://capacitorjs.com/docs/plugins |
| Push Notifications | https://capacitorjs.com/docs/apis/push-notifications |
| Deep Links | https://capacitorjs.com/docs/guides/deep-links |
| CI/CD | https://capacitorjs.com/docs/guides/ci-cd |

### Альтернативы (для сравнения)

| Тема | URL |
|---|---|
| React Native | https://reactnative.dev/docs/getting-started |
| Expo (RN) | https://docs.expo.dev |
| PWA (MDN) | https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps |

---

## Авторизация

### Два слоя

| Слой | Задача | Решение |
|---|---|---|
| Защита API от abuse | rate limit, scraping | rate limit + optional app key |
| Идентификация пользователя | запись, «мои заявки», push | JWT после OTP |

Контент (статьи, врачи) — **можно без логина** на первом этапе.

### Выбранная схема: телефон + код в Telegram

```
App: POST /auth/request { phone }
  → Backend находит telegram_chat_id по phone
  → Bot отправляет 6-значный код

App: POST /auth/verify { phone, code }
  → JWT access + refresh
```

**Плюсы:** бесплатно, сразу есть `chat_id` для уведомлений через бота, без SMS-провайдера.

**Ограничение Bot API:** бот **не может** написать пользователю, пока тот не нажал `/start`. Нужна первичная привязка:

1. Пользователь → `@VPract_bot` → `/start`
2. «Поделиться контактом» → backend сохраняет `phone ↔ chat_id`
3. Далее mobile app может слать коды

**Не закрывает:** пользователи без Telegram или при блокировке TG — нужен **SMS fallback** (фаза 2).

### Документация Telegram

| Тема | URL |
|---|---|
| Bot API | https://core.telegram.org/bots/api |
| Keyboard: request_contact | https://core.telegram.org/bots/api#keyboardbutton |
| Telegram Gateway (OTP как SMS) | https://core.telegram.org/gateway |

---

## Дистрибуция и сторы

| Канал | Android | iOS | Комментарий |
|---|---|---|---|
| **RuStore** | ✅ | — | Приоритет для РФ |
| Google Play | ✅ | — | Широкий охват |
| App Store | — | ✅ | $99/год, review |
| APK с сайта | ⚠️ | ❌ | ~30–50% установят; iOS practically 0 |

APK «скачать с сайта» — только beta / power users, не основной канал.

### Ссылки

| Тема | URL |
|---|---|
| RuStore для разработчиков | https://www.rustore.ru/help/developers |
| Google Play Console | https://play.google.com/console |
| Apple Developer | https://developer.apple.com |
| App Store Review Guidelines | https://developer.apple.com/app-store/review/guidelines/ |

---

## Архитектура (целевая)

```
apps/
  app/       ← Mini App (Telegram), без изменений
  mobile/    ← NEW Capacitor + React
  admin/
  server/
    middleware/
      telegram_initdata.go   ← только /api/clinics/...
      mobile_auth.go         ← JWT для mobile
packages/
  types/     ← общие DTO
```

```
POST /api/mobile/v1/auth/request
POST /api/mobile/v1/auth/verify
POST /api/mobile/v1/auth/refresh
GET  /api/mobile/v1/clinics/{slug}/doctors   → те же handlers
```

---

## Риски

| Риск | Митигация |
|---|---|
| TG заблокирован → OTP не приходит | SMS fallback (фаза 2) |
| App Store отклонит «web wrapper» | push, native splash, offline cache |
| Дублирование UI с Mini App | `@you-vet/types`, shared hooks; UI отдельный |
| Scraping публичного API | rate limit, app attestation позже |

---

## Вывод

Standalone mobile на текущем бэке — **средняя сложность**, не rewrite. Критично: mobile API без initData, Capacitor-клиент, auth по телефону через бота, публикация в RuStore + App Store.
