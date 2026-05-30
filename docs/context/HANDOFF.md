# Handoff — последняя сессия

> Обновляй этот файл **в конце каждой сессии**. AI читает его первым.

## Сессия 2026-05-30

**Участник:** Cursor (аудит + выравнивание документации)  
**Контекст:** Переход с Claude на Cursor. Prod проверен — бот работает, VPS доступен.

### Сделано

- [x] Полный технический аудит проекта → [audit.md](../audit.md)
- [x] Создана папка `docs/context/` для handoff между сессиями
- [x] Исправлены расхождения docs ↔ code:
  - ссылки на API (`docs/server/api.md`)
  - CI/CD деплой сервера (GHCR, не git pull)
  - честное описание RBAC на бэкенде
  - модель деплоя (single-clinic per VPS vs schema multi-tenant)
  - packages/cat в структуре монорепо
  - docs portal в deployment
- [x] Обновлён HTML-портал (index, project-for-devs, roadmap, audit.html)

### Не сделано / следующая сессия

- [ ] SEC-01: middleware `RequireRole` + ограничение groomer на бэкенде
- [ ] SEC-02: `clinic_id` во всех update/delete репозиториях
- [ ] INF-01: CI job `go test` + `npm run build` на PR
- [ ] INF-02: добавить `packages/cat/**` в `deploy-app.yml`
- [ ] PRD-01: скрывать груминг в Mini App если раздел пустой
- [ ] Удалить устаревшие `apps/*/.github/workflows/`

### Заметки

- Go module name: `go-server` (generic, не блокер)
- Admin: React 19, App: React 18 — осознанное расхождение
- Pre-commit hook в `apps/server/.githooks/` — ставится вручную, не в CI

---

## Шаблон для следующих сессий

```markdown
## Сессия YYYY-MM-DD

**Цель:**

### Сделано
- [ ]

### Не сделано / следующая сессия
- [ ]

### Заметки
-
```
