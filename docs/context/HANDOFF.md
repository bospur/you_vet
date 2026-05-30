# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия work-audit-clear (завершена)

**Ветка:** `work-audit-clear`

### Сделано

- [x] **PRD-01** — скрытие груминга в Mini App если breeds + schedule пусты
- [x] **INF-01** — `.github/workflows/ci.yml` (go test, lint, build admin+app на PR → dev)
- [x] **INF-02** — `packages/cat/**` в paths `deploy-app.yml`
- [x] **SEC-07** — initData на API (HMAC + Ed25519 для iOS), prod проверен ✅
- [x] PR → `dev`, деплой app + server

### Следующая сессия

- [ ] SEC-04: JWT → httpOnly cookie (опционально)
- [x] PRD-02: статьи — животное → статьи, slug auto, категории удалены

### Заметки

- Prod Mini App работает с валидацией initData (без `TELEGRAM_INITDATA_SKIP`)
- Локально без Telegram: `TELEGRAM_INITDATA_SKIP=1` в server `.env`

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
