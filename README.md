# vp-bot-app

Telegram Mini App для ветеринарной клиники.
Позволяет владельцам животных получить информацию первой помощи и расписание врачей прямо в Telegram.

**Prod:** https://app.snzbeachvolleyball25.ru
**Бот:** @VPract_bot

## Стек

| Инструмент | Назначение |
|---|---|
| Vite + React 18 + TypeScript | Основа |
| @telegram-apps/telegram-ui | Нативные UI-компоненты Telegram |
| TanStack Query v5 | Запросы к API, кэширование |
| React Router v6 | Навигация |

## Быстрый старт

```bash
npm install
cp .env.example .env.local   # задай VITE_API_URL и VITE_CLINIC_SLUG
npm run dev
```

Для тестирования Mini App нужен ngrok или аналог — Telegram требует HTTPS.

## Переменные окружения

| Переменная | Описание | Пример |
|---|---|---|
| `VITE_API_URL` | Базовый URL бэкенда | `https://api.snzbeachvolleyball25.ru` |
| `VITE_CLINIC_SLUG` | Slug клиники | `default` |

## Экраны

| Экран | Описание |
|---|---|
| Home | Главная с большими кнопками-разделами |
| Animals | Список видов животных |
| Categories | Категории для выбранного животного |
| Articles | Список статей в категории |
| Article | Полный текст статьи (HTML) |
| Doctors | Список опубликованных врачей |
| Doctor | Карточка врача с фото и ближайшим расписанием |
| Schedule | Расписание всех врачей клиники |

## Функциональность

- [x] Навигация с Telegram BackButton (регистрируется один раз, показ/скрыт по роуту)
- [x] Визуальная кнопка «‹ Назад» в NavList на всех экранах
- [x] Адаптация темы под Telegram (`--tg-theme-bg-color`, `appearance`)
- [x] Заглушка при открытии вне Telegram
- [x] Snackbar-уведомления об ошибках
- [x] Menu Button настроена через BotFather и программно при старте бота

## Деплой

Push в `dev` → GitHub Actions → `npm run build` → scp в `/var/www/vp-bot-app/` на VPS.

## Связанные репозитории

| Репозиторий | Назначение |
|---|---|
| [vp-bot-server](https://github.com/bospur/vp-bot-server) | Go бэкенд + Telegram бот |
| [vp-bot-admin](https://github.com/bospur/vp-bot-admin) | React админ-панель |
