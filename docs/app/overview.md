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
│       fetchCategories()
│       fetchArticles()
│       fetchArticle()
│       fetchDoctors()
│       fetchSchedule()
│       fetchGroomingBreeds()
│       fetchGroomingSchedule()
│
├── screens/
│   ├── HomeScreen.tsx          — главная: баннер, лого, название, телефон, сетка разделов
│   ├── AnimalsScreen.tsx       — список животных
│   ├── CategoriesScreen.tsx    — категории выбранного животного
│   ├── ArticlesScreen.tsx      — список статей категории
│   ├── ArticleScreen.tsx       — полная статья (HTML рендер)
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
│   │   ├── NavGrid.tsx         — сетка 2×2 навигационных карточек
│   │   ├── NavGrid.module.css
│   │   └── icons.tsx           — SVG иконки: IconFirstAid, IconDoctors, IconSchedule, IconGrooming
│   ├── NavList/
│   │   └── NavList.tsx         — вертикальный список навигации (используется во вложенных экранах)
│   ├── DoctorAvatar/
│   ├── Preloader/
│   └── ErrorBoundary.tsx
│
└── hooks/
    ├── useBackButton.ts        — хук для Telegram BackButton
    └── useNotification.tsx
```

## Главный экран (HomeScreen)

Загружает `GET /api/clinics/{slug}/clinic-info` при монтировании.

Структура экрана сверху вниз:

```
[Баннер — полная ширина, кнопка × закрывает на сессию (sessionStorage)]
[Лого] [Название клиники]
       [Описание]
[🟢 Позвонить +7...] ← tel: ссылка, зелёная кнопка
[📍 Адрес]
[─────────────────────────]
[ Первая помощь ] [ Врачи ]    ← NavGrid 2×2, SVG иконки
[ Расписание    ] [ Груминг]
```

Все блоки опциональны — если поле не заполнено в админке, блок не отрисовывается.

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
