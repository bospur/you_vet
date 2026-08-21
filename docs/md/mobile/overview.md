# Мобильное приложение — обзор

> Статус: **в разработке, APK на телефоне** · Обновлено: 2026-08-21  
> Не путать с Telegram Mini App. Общий Go API и PostgreSQL.

Отдельное приложение **«Ветпрактика»** (Capacitor, Android; iOS-оболочка в репо, симулятор ждёт Xcode). Публикация в RuStore — этап M3, ещё не начат.

| | |
|---|---|
| Название | Ветпрактика |
| appId | `ru.snzbeachvolleyball25.vetpraktika` (**не менять** при смене веб-домена) |
| API | `https://api.bospur.ru/api/mobile/v1` |
| Клиника в сборке | `VITE_CLINIC_SLUG=default` |

## Документы

| Документ | Содержание |
|---|---|
| [design-mvp.md](./design-mvp.md) | MVP RuStore v1: scope, экраны, UI, auth |
| [screen-specs.md](./screen-specs.md) | Wireframes экранов |
| [app-id-and-stores.md](./app-id-and-stores.md) | appId, RuStore, подпись |
| [rustore-guide.md](./rustore-guide.md) | Чеклист первой публикации |
| [multi-tenant-notes.md](./multi-tenant-notes.md) | 1 клиника на сборку |
| [roadmap.md](./roadmap.md) | Исторический план Capacitor (чеклисты M0–M1 закрыты в коде) |

На портале: [RuStore гайд](/rustore-app) · [продажи / как показывать APK](/sales).

## Что уже есть (M0–M2)

- Backend `/api/mobile/v1`, миграции 019–021, OTP в Telegram, VK ID.
- Shell: splash, tabs, главная, статьи, врачи, груминг, клиника.
- Auth UI, гостевой режим, ЛК (имя, фото), вопрос врачу (ответ в TG).
- Polish: логотип, баннер, сетка врачей, refresh / 401 → login.

## Что дальше

| Этап | Статус |
|---|---|
| M2b запись в приложении | sprint 5 |
| M3 RuStore (AAB, модерация) | backlog |
| iOS симулятор | нужен полный Xcode |

## Каналы продукта

```
Go API + PostgreSQL
       ├── Mini App (Telegram)     — initData
       ├── Telegram Bot            — bot API
       ├── Admin                   — cookie JWT
       └── Mobile App (Capacitor)  — mobile JWT
```
