# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия work-audit-clear (завершена)

**Ветка:** `work-audit-clear`

### Сделано

- [x] **PRD-01** — скрытие груминга в Mini App если breeds + schedule пусты
- [x] **INF-01** — `.github/workflows/ci.yml` (go test, lint, build admin+app на PR → dev)
- [x] **INF-02** — `packages/cat/**` в paths `deploy-app.yml`
- [x] **SEC-07** — валидация Telegram initData на публичных `/api/clinics/...`
  - `middleware/telegram_initdata.go` + тесты
  - Mini App шлёт заголовок `X-Telegram-Init-Data`
  - Локально: `TELEGRAM_INITDATA_SKIP=1` в `.env` server

### Следующая сессия

- [ ] PR → `dev`, деплой app + server (initData обязателен на prod)
- [ ] SEC-04: JWT → httpOnly cookie (опционально)
- [ ] PRD-02: архитектура статей

### Заметки

- После деплоя server без `TELEGRAM_INITDATA_SKIP` Mini App **должен** отправлять initData (уже в `api/client.ts`)
- `/uploads/` без initData — картинки грузятся напрямую

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
