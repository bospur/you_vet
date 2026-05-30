# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-05-30

**Ветка:** `work-arcticles` / `dev` (PRD-02 + фиксы)

### Сделано

- [x] PRD-02 в prod: животное → статьи, без категорий, миграция 009
- [x] `GET /api/admin/animals` — админка не ходит на публичный API (401 после SEC-07)
- [x] Mini App: FAB «Наверх» на экране статьи (`ScrollToTopFab`)
- [x] Документация: `roadmap.html`, `STATUS.md`, `app/overview.md`, `project-for-devs.html`

### Следующая сессия

- [ ] PRD-03: запись на приём (фаза 4)
- [ ] SEC-04: JWT → httpOnly cookie (опционально)
- [ ] SEC-06: валидация загрузки по MIME

### Заметки

- CI: на PR — quality gate; после merge в `dev` — снова CI + path-based deploy
- Prod Mini App: initData обязателен; локально `TELEGRAM_INITDATA_SKIP=1`

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
