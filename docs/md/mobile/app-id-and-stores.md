# App ID, RuStore и магазины — обучающий справочник

> Для кого: первый опыт публикации Android-приложения  
> Связано: [design-mvp.md](./design-mvp.md) · [research.md](./research.md)

## Что такое App ID (applicationId)

**App ID** (в Android / Capacitor — поле `appId` в `capacitor.config.ts`, в Gradle — `applicationId`) — это **уникальный идентификатор приложения в мире**, по аналогии с доменом в интернете.

Формат: **reverse domain notation** (обратный домен) — это **не URL** и **не поддомен** сайта.

```
ru . snzbeachvolleyball25 . vetpraktika
│    │                    │
│    │                    └── имя приложения (как «подсервис» под доменом)
│    └── домен без зоны .ru
└── зона (ru, com…)
```

### App ID ≠ поддомен сайта

| Что | Пример | Для чего |
|---|---|---|
| **Поддомен (DNS)** | `vetpraktika.bospur.ru` | Сайт/API в браузере (как `app.…`, `api.…`) |
| **App ID (Android)** | `ru.snzbeachvolleyball25.vetpraktika` | Идентификатор в RuStore / Android OS |

Порядок **разный**:

- URL читается слева направо: `vetpraktika` → `snzbeachvolleyball25` → `ru`
- App ID — **наоборот**, как Java-пакеты: `ru` → `snzbeachvolleyball25` → `vetpraktika`

Если бы поддомен для веба был `vetpraktika.bospur.ru`, то **правильный** appId всё равно был бы `ru.snzbeachvolleyball25.vetpraktika`, а не строка `vetpraktika.bospur.ru`.

`vetpraktika.bospur.ru` как appId технически иногда проходит, но это **не стандарт**: путает с hostname, хуже для сторов и документации. Не используем.

### Зачем он нужен

| Кто использует | Зачем |
|---|---|
| **RuStore / Google Play** | Отличить ваше приложение от чужих; обновления попадают только в «своё» приложение |
| **Android OS** | Папка с данными приложения, разрешения, deep links |
| **FCM (push)** | Привязка уведомлений к конкретному приложению |

### App ID ≠ название на иконке

| Поле | Пример | Меняется после публикации? |
|---|---|---|
| **appId** | `ru.snzbeachvolleyball25.vetpraktika` | **Нет** (только новое приложение в сторе) |
| **appName** (отображаемое имя) | `Ветпрактика` | Да, в настройках стора |
| **Иконка, скриншоты** | … | Да |

### Рекомендация для «Ветпрактика» (2026-06-09)

```
appId:   ru.snzbeachvolleyball25.vetpraktika
appName: Ветпрактика
```

**Почему так:**

- App ID выбран при старте проекта и **зафиксирован**. Веб-домен сейчас `bospur.ru`; `appId` при смене домена **не меняем** (иначе RuStore увидит другое приложение).
- `vetpraktika` — транслит названия «Ветпрактика», латиница, без дефисов (дефисы в appId допустимы, но реже используют).
- При white-label для другой клиники позже: **другой appId** и отдельная сборка, например `ru.otherclinic.vetapp` (см. [multi-tenant-notes.md](./multi-tenant-notes.md)).

```ts
// apps/mobile/capacitor.config.ts (будущий файл)
const config: CapacitorConfig = {
  appId: 'ru.snzbeachvolleyball25.vetpraktika',
  appName: 'Ветпрактика',
  webDir: 'dist',
};
```

### Частые ошибки новичков

1. **Менять appId после первой публикации** — стор считает это **другим** приложением; пользователи не получат обновление.
2. **Использовать `com.example.*`** — для тестов ок, для prod — нет.
3. **Путать appId с bundle ID iOS** — для Capacitor обычно **одно и то же значение** в `appId` (iOS подхватит при `cap add ios`).
4. **Кириллица в appId** — нельзя, только `a-z`, цифры, точки.

---

## RuStore — что это и как связано с App ID

**RuStore** — российский магазин Android-приложений (аналог Google Play для РФ).

| Этап | Что делаете вы | Что происходит |
|---|---|---|
| 1. Регистрация | Аккаунт разработчика на [rustore.ru](https://www.rustore.ru/help/developers) | Юрлицо / ИП, верификация |
| 2. Создание приложения | Указываете название «Ветпрактика», категорию | Появляется карточка в консоли |
| 3. Загрузка сборки | AAB или APK, подписанный **upload key** | RuStore проверяет подпись |
| 4. Модерация | Скриншоты, описание, privacy policy | 1–3 рабочих дня (ориентир) |
| 5. Публикация | Включаете релиз | Пользователи видят в каталоге |

**App ID** внутри APK должен **совпадать** с тем, что вы заложили в Capacitor при первой загрузке. RuStore не «выдаёт» appId — вы задаёте его в коде.

### Подпись приложения (keystore)

Отдельная важная тема:

| Термин | Суть |
|---|---|
| **Keystore** | Файл `.jks` / `.keystore` с ключом подписи |
| **Upload key** | Ключ, которым вы подписываете сборку перед загрузкой |
| **Потеря keystore** | Нельзя выпускать обновления в то же приложение — только новое с новым appId |

**Правило:** keystore хранить в **менеджере паролей + бэкап** (не в git). В CI — GitHub Secret `ANDROID_KEYSTORE_BASE64`.

---

## Capacitor: где что лежит

```
capacitor.config.ts     appId, appName  ← задаёте один раз осознанно
        │
        ▼  npx cap sync
android/app/build.gradle   applicationId ← копия из config
android/.../strings.xml    app_name      ← отображаемое имя
```

Команды (когда появится `apps/mobile`):

```bash
cd apps/mobile
npm run build
npx cap sync android
npx cap open android   # Android Studio → Build → Generate Signed Bundle
```

---

## Связь с нашим бэкендом

App ID **не участвует** в API-запросах. Клиника задаётся отдельно:

| Переменная | Пример | Назначение |
|---|---|---|
| `VITE_CLINIC_SLUG` | `default` | Какую клинику показывать (`/api/mobile/v1/clinics/default/...`) |
| `VITE_API_URL` | `https://api.bospur.ru` | Хост API |

Один APK «Ветпрактика» = один slug в сборке. Другая клиника в будущем = другая сборка (другой slug, возможно другой appId).

---

## Чеклист перед первой сборкой

- [ ] appId выбран и записан в `capacitor.config.ts`
- [ ] appName = **Ветпрактика**
- [ ] Keystore создан, пароли сохранены
- [ ] `VITE_CLINIC_SLUG` для prod-сборки
- [ ] Privacy policy URL готов (требует RuStore)
- [ ] Иконка 512×512

---

## Ссылки

| Тема | URL |
|---|---|
| RuStore для разработчиков | https://www.rustore.ru/help/developers |
| Capacitor Android | https://capacitorjs.com/docs/android |
| Capacitor config | https://capacitorjs.com/docs/config |
| Подпись Android (Google) | https://developer.android.com/studio/publish/app-signing |
