# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия — новая (старт)

**Ветка:** `work-tech` (чистое дерево, синхрон с `origin/work-tech`)

**Не в `dev`:** 2 коммита (`0570d67` аудит + `986aa35` security hardening). Prod API **ещё без** RBAC/CORS/rate-limit — после merge в `dev` задеплоится `deploy-server.yml`.

**Приоритеты на эту сессию:**

1. PR в `dev` с `work-tech` (если готово к релизу) → автодеплой server
2. PRD-01 — скрывать груминг в Mini App, если раздел пустой
3. INF-01 — CI quality gate на PR (test/lint/build)
4. SEC-07 — валидация Telegram `initData`

**Быстрый старт для AI:**

```bash
cd apps/server && go test ./...
git log dev..HEAD --oneline   # что уйдёт в dev при merge
```

---

## Сессия 2026-05-30 — security hardening (завершена)

**Цель:** roadmap, кнопки «назад» в HTML, security hardening admin API

### Сделано

- [x] `middleware/role.go` — RequireRole; `role_test.go` (3 кейса)
- [x] `middleware/ratelimit.go` — login 10 req / 15 min
- [x] `middleware/cors.go` — whitelist origins (`CORS_ORIGINS` env)
- [x] `clinic_id` в update/delete repositories (animals, articles, doctors, grooming, users)
- [x] `main.go`: contentAuth / groomingAuth / adminAuth
- [x] HTML: «← Все документы» на sub-страницах; roadmap/audit/roles обновлены
- [x] Коммит `986aa35` на `work-tech`

### Не сделано (перенесено выше)

- [ ] Merge `work-tech` → `dev` + проверка prod API
- [ ] PRD-01, INF-01, INF-02, SEC-07

### Заметки

- CORS по умолчанию: admin/app prod + localhost
- JWT по-прежнему в localStorage (SEC-04) — отдельная задача

---

## Шаблон

```markdown
## Сессия YYYY-MM-DD
**Цель:**
### Сделано
- [ ]
### Следующая сессия
- [ ]
```
