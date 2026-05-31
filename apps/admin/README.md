# vp-bot-admin / YouVet Admin

Административная панель для ветеринарного Telegram Mini App.
Управление контентом: животные, категории, статьи, врачи, расписание, груминг, пользователи.

**Prod:** https://admin.snzbeachvolleyball25.ru

## Стек

| Инструмент | Назначение |
|---|---|
| Vite + React 19 + TypeScript | Основа |
| MUI v7 | UI-компоненты |
| React Router v7 | Роутинг (data router, `useBlocker`) |
| TanStack Query v5 | Серверное состояние |
| React Hook Form + Valibot | Формы и валидация |
| TipTap v2 | WYSIWYG редактор статей |
| Axios | HTTP-клиент |

## Быстрый старт

```bash
npm install
cp .env.example .env.local
# VITE_API_URL=http://localhost:8080
# VITE_CLINIC_SLUG=default
npm run dev
```

## Переменные окружения

| Переменная | Описание | Пример |
|---|---|---|
| `VITE_API_URL` | Базовый URL бэкенда | `https://api.snzbeachvolleyball25.ru` |
| `VITE_CLINIC_SLUG` | Slug клиники (для публичных путей, если нужен) | `default` |

## Роли

| Роль | Доступ |
|---|---|
| `admin` | Полный доступ + «Обзор» (статистика Mini App), default `/dashboard` |
| `editor` | Контент без публикации |
| `groomer` | Только `/grooming` (редирект в UI) |
| `manager` | Только `/booking` (запись на приём) |

> RBAC на бэкенде — см. [docs/roles.md](../../docs/roles.md)

## Мобильная адаптация (обязательно для новых экранов)

Breakpoint: MUI `theme.breakpoints.down('sm')`.

| Паттерн | Реализация |
|---|---|
| Списки | `Table` на `≥ sm`, карточки / `Paper` на `< sm` |
| Заголовок + действие | `h6` на mobile, кнопка «Добавить» → `IconButton` + `Tooltip` |
| Формы в диалогах | `fullScreen={isMobile}`, поля `fullWidth` |
| Вкладки | `variant="scrollable"` + короткие подписи на mobile |
| Сетки | `gridTemplateColumns: repeat(2, 1fr)` на календаре и т.п. |

Эталоны: `GroomingScreen`, `BookingScreen` (`/booking`).

## Функциональность

- [x] Auth: JWT, роли admin / editor / groomer / manager, axios interceptor
- [x] Layout: AppBar + Sidebar (mobile hamburger)
- [x] Мобильная адаптация: карточки вместо таблиц на `< sm`
- [x] CRUD: Животные, категории, статьи (TipTap, draft/published)
- [x] CRUD: Врачи (фото, статусы), расписание + исключения
- [x] Груминг: породы, шаблон недели, календарь записей
- [x] **Запись** (`/booking`): услуги, расписание (шаблон + календарь), заявки, настройки чата (B1–B4)
- [x] О клинике: лого, баннер, контакты
- [x] Пользователи (только admin)
- [x] Обзор: уникальные посетители Mini App (сегодня / 7 / 30 / всего, только admin)

## Документация

- [Архитектура admin](../../docs/admin/architecture.md)
- [Инструкция для пользователя](../../docs/admin/user-guide.md)
- [Системная архитектура](../../docs/architecture.md)
- [Разработка](../../docs/development.md)
- [Деплой](../../docs/deployment.md)
- [Аудит](../../docs/audit.md)
