# Ветпрактика — публикация в RuStore

> Практическое руководство для первого релиза · Обновлено: 2026-06-09  
> Связано: [app-id-and-stores.md](./app-id-and-stores.md) · [design-mvp.md](./design-mvp.md)

Отдельное Android-приложение **«Ветпрактика»** (Capacitor). Не путать с Telegram Mini App.

| Параметр | Значение |
|---|---|
| Название в сторе | **Ветпрактика** |
| App ID (package) | `ru.snzbeachvolleyball25.vetpraktika` |
| Клиника в сборке | `VITE_CLINIC_SLUG=default` |
| API | `https://api.bospur.ru/api/mobile/v1` |

---

## Официальная документация RuStore

| Тема | URL |
|---|---|
| Раздел для разработчиков (оглавление) | https://www.rustore.ru/help/developers |
| Консоль разработчика | https://www.rustore.ru/developer |
| **Публикация приложения** (главная инструкция) | https://www.rustore.ru/help/developers/publishing-and-verifying-apps/app-publication |
| EN: Publishing apps | https://www.rustore.ru/help/en/developers/publishing-and-verifying-apps/app-publication |
| Полная PDF-документация | https://static.rustore.ru/rustore-en-developers-documentation.pdf |

Вход в консоль: [console.rustore.ru](https://console.rustore.ru) через **VK ID**.

---

## Порядок действий (первый раз)

### 1. Аккаунт разработчика

1. Зарегистрироваться в RuStore Консоль (VK ID).
2. Для **бесплатного** приложения без встроенных покупок часто достаточно аккаунта **физлица**.
3. Монетизация через RuStore (платные приложения, подписки) — **ИП/юрлицо**, часто нужна ЭЦП / VK Бизнес ID.

### 2. Карточка приложения

1. Консоль → **Приложения** → **Добавить приложение**
2. Название: **Ветпрактика**
3. **Загрузить версию**
4. `packageName` = `ru.snzbeachvolleyball25.vetpraktika`

### 3. Сборка Android (у нас)

```bash
cd apps/mobile
cp .env.example .env.local   # VITE_API_URL, VITE_CLINIC_SLUG
npm run build
npx cap sync android
npx cap open android
```

В Android Studio: **Build → Generate Signed Bundle / APK** → **AAB** (рекомендуется).

| Тема | Ссылка |
|---|---|
| Capacitor Android | https://capacitorjs.com/docs/android |
| Подпись APK/AAB | https://developer.android.com/studio/publish/app-signing |

### 4. Keystore — критично

- Файл `.jks` / `.keystore` и пароли — **сохранить навсегда** (менеджер паролей + бэкап).
- Потеря keystore = нельзя обновлять то же приложение в RuStore.

### 5. Загрузка в RuStore

RuStore принимает **APK** и **AAB**. Для AAB подпись настраивается **до** загрузки.

После загрузки: описание, скриншоты, **политика конфиденциальности** (URL), контакты поддержки → **на модерацию**.

Модерация: ориентир ~1 час, закладывайте 1–3 рабочих дня.

---

## Материалы для модерации (чеклист)

- [ ] Иконка 512×512, adaptive icon
- [ ] Скриншоты (мин. 2): главная, запись, статья, врачи
- [ ] Краткое и полное описание
- [ ] Категория: здоровье / медицина
- [ ] **Privacy policy** URL (обработка телефона, ФИО, данные питомца)
- [ ] Контакты поддержки (телефон/email клиники)
- [ ] Согласие на ПДн в форме записи (в приложении)

---

## Auth перед тестом записи

1. Пользователь: `t.me/VPract_bot?start=link` → поделиться номером
2. В приложении: телефон → код в Telegram → JWT
3. Запись через `/api/mobile/v1/.../booking/requests`

---

## Прогресс разработки

| Этап | Статус |
|---|---|
| M0 API + миграция 019 | в коде, deploy server |
| M1 shell (splash, tabs, главная) | в коде |
| Sprints 2–5 (статьи, auth UI, booking) | backlog |
| RuStore первая публикация | после M2 + материалы |

Подробнее: [screen-specs.md](./screen-specs.md) · [mobile.html](../../html/mobile.html)
