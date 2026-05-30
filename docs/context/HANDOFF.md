# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-05-30 (продолжение)

**Цель:** roadmap, кнопки «назад» в HTML, security hardening

### Сделано

- [x] Security hardening на бэкенде:
  - `middleware/role.go` — RequireRole
  - `middleware/ratelimit.go` — login 10/15min
  - `middleware/cors.go` — whitelist origins
  - clinic_id во всех update/delete repositories
  - main.go: contentAuth / groomingAuth / adminAuth
- [x] Тесты: role_test.go (3 кейса), go test ./... проходит
- [x] HTML: кнопка «← Все документы» на всех sub-страницах
- [x] Roadmap: security ✅, CI quality gate в backlog фазы 3
- [x] docs/roles.md, audit.md, ISSUES.md обновлены

### Не сделано / следующая сессия

- [ ] PRD-01: скрывать груминг в Mini App если пустой
- [ ] INF-01: CI quality gate на PR
- [ ] INF-02: packages/cat в deploy-app paths
- [ ] SEC-07: Telegram initData валидация
- [ ] Деплой server на prod (push apps/server → CI)

### Заметки

- После merge в dev — server задеплоится автоматически через GHCR
- CORS: по умолчанию admin/app prod + localhost. Override: `CORS_ORIGINS` env

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
