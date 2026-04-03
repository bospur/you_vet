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
