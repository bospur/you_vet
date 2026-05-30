# Технический аудит YouVet

> Дата: 2026-05-30 · Автор: Cursor (сессия аудита)  
> Контекст для AI: [context/](./context/) · Handoff: [context/HANDOFF.md](./context/HANDOFF.md)

## Резюме

YouVet — **зрелый MVP в продакшене**: монорепо, три клиента, CI/CD, богатая документация.
Архитектура и продуктовая логика на хорошем уровне. Security hardening выполнен 2026-05-30. Главный оставшийся риск — **отсутствие CI quality gate и автотестов**.

| Область | Оценка |
|---|---|
| Архитектура | ★★★★☆ |
| Код бэкенда | ★★★☆☆ |
| Фронтенд | ★★★★☆ |
| Тесты | ★☆☆☆☆ |
| CI/CD (deploy) | ★★★☆☆ |
| Документация | ★★★★☆ (после синхронизации 2026-05-30) |
| Безопасность | ★★★☆☆ (после hardening 2026-05-30) |

---

## Сильные стороны

### Архитектура

- Чистые слои: `HTTP → middleware → handler → repository → PostgreSQL`
- Миграции golang-migrate, auto-run при старте
- Admin: модульная структура (`data/source` → `modules/*/features` → `screens`)
- Shared-пакеты `@you-vet/types`, `@you-vet/cat`

### Продукт

- Полный цикл: контент, врачи, расписание, груминг, брендинг клиники
- Роли admin/editor/groomer продуманы на уровне UX
- Mini App: Telegram-native UX (back button, theme, gate «только из Telegram»)

### Инфраструктура

- Path-based GitHub Actions deploy
- Server через GHCR (образ `ghcr.io/bospur/you_vet-server:latest`)
- Docs portal: `docs.snzbeachvolleyball25.ru`
- Pre-commit hook в `apps/server/.githooks/` (gofmt, vet, test, build)

---

## Критические находки

### 1. RBAC на бэкенде — ✅ исправлено (2026-05-30)

`RequireRole` middleware на группах роутов: content (admin+editor), grooming (+groomer), admin-only (users, settings, publish).

### 2. Tenant-scoping — ✅ исправлено (2026-05-30)

Update/delete во всех repositories используют `WHERE id = $1 AND clinic_id = $2`.

### 3. CORS — ✅ исправлено (2026-05-30)

Whitelist origin вместо `*`. Env: `CORS_ORIGINS` (опционально).

### 4. Rate limit на login — ✅ исправлено (2026-05-30)

10 попыток / 15 мин на IP.

### 5. JWT в localStorage

Admin хранит токен в `localStorage` (`vp_admin_token`). При XSS — компрометация сессии.

---

## Технический долг

### Тестирование

| Область | Статус |
|---|---|
| Go unit tests | 2 файла: auth_test.go + role_test.go |
| Frontend tests | Нет (vitest/jest/cypress отсутствуют) |
| E2E | Нет |
| CI test job | Нет |

### Зависимости и монорепо

- React 19 (admin) vs React 18 (app) — осознанное расхождение, усложняет поддержку
- `turbo: "latest"` не закреплён в root `package.json`
- Go module name `go-server` — generic
- `deploy-app.yml` не следит за `packages/cat/**`

### Устаревшие артефакты

- `.claude/commands/css-from-tsx.md` — след работы с Claude
- Дублирующие CI в `apps/*/.github/workflows/` (активны только корневые)

### Мультитенантность vs деплой

| Уровень | Реальность |
|---|---|
| Схема БД | `clinics`, `clinic_id` на всех таблицах |
| Runtime | Один `CLINIC_SLUG` / `VITE_CLINIC_SLUG` на инстанс |
| Bootstrap | Первый admin создаётся с `clinic_id = 1` |

**Вывод:** schema-ready multi-tenant, deploy — single-clinic per instance.

---

## Расхождения документации (исправлены 2026-05-30)

| Было | Стало |
|---|---|
| README → `docs/api.md` | → `docs/server/api.md` |
| `deployment.md`: git pull + docker build на VPS | GHCR pull (см. `deploy-server.yml`) |
| `roles.md`: полный backend RBAC | Честная матрица: UI + частичный backend |
| `architecture.md`: git pull в CI | GHCR workflow |
| HTML: «мультитенантность из коробки для prod» | Single-clinic per VPS + schema-ready |
| `monorepo.md`: только `packages/types` | + `packages/cat` |
| `apps/admin/README.md`: битые ссылки на docs | `../../docs/...` |

Полный трекер: [context/ISSUES.md](./context/ISSUES.md)

---

## Приоритетный план

### P0 — безопасность

1. ~~Middleware `RequireRole`~~ ✅
2. ~~`clinic_id` в update/delete~~ ✅
3. ~~CORS whitelist~~ ✅
4. ~~Rate limit на login~~ ✅

### P1 — качество (следующий шаг)

5. CI quality gate: `go test ./...`, `npm run build` на PR
6. Table-driven тесты RBAC
7. `packages/cat/**` в deploy-app paths

### P2 — maintainability

8. Закрепить turbo version
9. Удалить дублирующие workflows
10. Явно задокументировать single-clinic vs SaaS roadmap

### P3 — по желанию

11. React 18→19 в Mini App
12. HttpOnly cookie вместо localStorage
13. E2E smoke (Playwright)

---

## Связанные документы

- [roles.md](./roles.md) — роли и фактическое состояние RBAC
- [architecture.md](./architecture.md) — схема системы
- [deployment.md](./deployment.md) — инфраструктура и CI/CD
- [roadmap.html](./roadmap.html) — продуктовый roadmap (HTML-портал)
