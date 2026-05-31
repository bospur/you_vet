# YouVet — документация

SaaS-платформа для ветеринарных клиник. Telegram Mini App + веб-панель управления + Go API.

---

## Навигация

### Общее

| Документ | Описание |
|---|---|
| [architecture.md](./architecture.md) | Схема системы, монорепо, CI/CD |
| [data-model.md](./data-model.md) | Схема базы данных, миграции |
| [roles.md](./roles.md) | Ролевая модель (admin, editor, groomer) |
| [deployment.md](./deployment.md) | Инфраструктура, деплой, env-переменные |
| [development.md](./development.md) | Локальная разработка |
| [monorepo.md](./monorepo.md) | Устройство монорепо, Turborepo |
| [audit.md](./audit.md) | Технический аудит проекта |
| [context/](./context/) | Контекст для AI-сессий (handoff) |

### HTML-портал (деploy → docs.snzbeachvolleyball25.ru)

| Страница | Аудитория |
|---|---|
| [index.html](./index.html) | Навигация по документам |
| [project-for-devs.html](./project-for-devs.html) | Разработчики |
| [roadmap.html](./roadmap.html) | Roadmap проекта |
| [design-brief.html](./design-brief.html) | Дизайнеры |
| [audit.html](./audit.html) | Технический аудит |
| [mobile.html](./mobile.html) | Мобильное приложение (Capacitor, research, roadmap) |
| [registration-phase-survey.html](./registration-phase-survey.html) | Анкета для клиники — сбор данных перед записью на приём |

### Мобильное приложение (`apps/mobile` — planned)

| Документ | Описание |
|---|---|
| [mobile/overview.md](./mobile/overview.md) | Обзор, решения |
| [mobile/research.md](./mobile/research.md) | Аналитика и варианты |
| [mobile/roadmap.md](./mobile/roadmap.md) | Roadmap, монорепо |

### Бэкенд (`apps/server`)

| Документ | Описание |
|---|---|
| [server/overview.md](./server/overview.md) | Архитектура, структура кода, env |
| [server/api.md](./server/api.md) | Полный API reference |

### Админ-панель (`apps/admin`)

| Документ | Описание |
|---|---|
| [admin/architecture.md](./admin/architecture.md) | Архитектура фронтенда, паттерны, роутинг |
| [admin/user-guide.md](./admin/user-guide.md) | Инструкция для пользователей |

### Telegram Mini App (`apps/app`)

| Документ | Описание |
|---|---|
| [app/overview.md](./app/overview.md) | Структура приложения, экраны, компоненты |

---

## Быстрый старт

```bash
# Клонировать репо
git clone https://github.com/Bospur/you_vet.git
cd you_vet

# Запустить всё (бэкенд + фронты параллельно)
npm install
npm run dev
```

Подробнее → [development.md](./development.md)
