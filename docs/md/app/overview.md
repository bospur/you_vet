# Telegram Mini App — обзор

`apps/app` — React SPA, открывается внутри Telegram как Mini App.

## Структура файлов

```
src/
├── App.tsx                     — роутинг + BackButtonHandler (Telegram BackButton)
├── main.tsx
│
├── api/
│   ├── client.ts               — axios (baseURL = /api/clinics/{CLINIC_SLUG})
│   └── index.ts                — все fetch-функции + TypeScript-интерфейсы
│       fetchClinicInfo()       — GET /clinic-info
│       fetchAnimals()
│       fetchArticles(animalSlug)
│       fetchArticle(slug)
│       fetchDoctors()
│       fetchSchedule()
│       fetchGroomingBreeds()
│       fetchGroomingSchedule()
│       fetchFeaturedArticles() — GET /articles/featured
│
├── screens/
│   ├── HomeScreen.tsx          — главная: «О нас», «Полезное», «Рекомендуем», баннер
│   ├── AnimalsScreen.tsx       — список животных
│   ├── ArticlesScreen.tsx      — список статей выбранного животного
│   ├── ArticleScreen.tsx       — полная статья (HTML) + FAB «Наверх»
│   ├── DoctorsScreen.tsx       — список врачей
│   ├── DoctorScreen.tsx        — карточка врача
│   ├── ScheduleScreen.tsx      — расписание на период (горизонтальный карусель дат)
│   ├── GroomingScreen.tsx      — главная груминга
│   ├── GroomingBreedsScreen.tsx — коллекция пород
│   ├── GroomingScheduleScreen.tsx — расписание грумера
│   └── TelegramOnlyScreen.tsx  — экран ошибки вне Telegram
│
├── components/
│   ├── NavGrid/
│   │   ├── NavGrid.tsx         — сетка 2×2 навигационных карточек (tap-анимации)
│   │   ├── NavGrid.module.css
│   │   └── icons.tsx           — inline SVG: ❤️ статьи, 👤 врачи, календарь, ножницы
│   ├── FeaturedArticles/       — блок «Рекомендуем» (до 3 featured-статей)
│   ├── HomeHero/               — коллапс «О нас»: контакты, слоган по центру, «Позвонить»
│   ├── AppHeader/              — шапка с лого и названием клиники
│   ├── NavList/
│   │   └── NavList.tsx         — вертикальный список навигации (используется во вложенных экранах)
│   ├── DoctorAvatar/
│   ├── Preloader/
│   ├── ScrollToTopFab/         — кнопка «Наверх» (видна, когда якорь ушёл с экрана)
│   └── ErrorBoundary.tsx
│
└── hooks/
    ├── useBackButton.ts        — хук для Telegram BackButton
    ├── useGroomingAvailable.ts — проверка наличия груминга (PRD-01)
    └── useNotification.tsx
```

## Главный экран (HomeScreen)

Загружает `GET /api/clinics/{slug}/clinic-info` через layout; featured — `GET /articles/featured`.

Структура экрана сверху вниз:

```
[AppHeader — лого + название клиники]
[HomeHero — коллапс «О нас»: контакты, «Позвонить», слоган по центру]
[Полезное — NavGrid 2×2 с подписями и tap-анимациями]
  Статьи (советы и помощь) | Наши врачи (специалисты клиники)
  Расписание (часы приёма) | Груминг (стрижка и уход) — скрыт/скелетон если пусто
[Рекомендуем — до 3 featured-статей, если заданы в admin]
[Баннер — внизу, если banner_enabled; × закрывает на сессию (sessionStorage)]
```

Груминг: при загрузке — skeleton-плитка; если раздел пуст — карточка не показывается (PRD-01).

## Навигация и BackButton

`BackButtonHandler` в `App.tsx` подписывается на `Telegram.WebApp.BackButton`:
- Корневой маршрут (`/`) → кнопка скрыта
- Вложенные маршруты → кнопка показана, нажатие = `navigate(-1)`
- При сворачивании/разворачивании Telegram восстанавливает состояние через `onEvent('activated')`

## Проверка среды

При запуске вне Telegram (нет `window.Telegram?.WebApp`) показывается `TelegramOnlyScreen`.

## Переменные окружения

| Переменная | Описание |
|---|---|
| `VITE_API_URL` | Базовый URL бэкенда (default: `https://api.snzbeachvolleyball25.ru`) |
| `VITE_CLINIC_SLUG` | Slug клиники (default: `default`) |

## Локальная разработка

```bash
cd apps/app
npm install
cp .env.example .env.local
# VITE_API_URL=http://localhost:8080
# VITE_CLINIC_SLUG=default
npm run dev   # localhost:5174
```

> Для тестирования в Telegram нужен HTTPS — используйте ngrok или аналог.

API-запросы отправляют initData в `X-Telegram-Init-Data` и `Authorization: tma …` (`utils/telegramInitData.ts`, `api/client.ts`).
В `index.html` подключён `telegram-web-app.js`. Без initData публичные эндпоинты вернут 401.
Локально: `TELEGRAM_INITDATA_SKIP=1` на server.

## Деплой

CI/CD: пуш в `dev` → GitHub Actions → `npm build` → `scp dist/` → `/var/www/vp-bot-app/`

Nginx раздаёт статику с `app.snzbeachvolleyball25.ru`.
