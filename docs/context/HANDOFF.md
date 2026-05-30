# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-05-30 (M0 polish + admin «Обзор»)

**Ветка:** `work-doc-up` → push в origin, затем PR в `dev`

### Сделано

**Mini App:**
- [x] Haptic, «Сегодня в клинике», skeleton/fallback «Рекомендуем», spinner вместо CatPreloader
- [x] Тёмная тема TG: `data-tg-theme` + токены `--vet-*` на всех экранах
- [x] Sticky «Позвонить» — **убран** (фидбек); звонок: «О нас» + иконка в хедере

**M0 аналитика (в `dev` после PR #35 + эта ветка):**
- [x] `012_telegram_users`, upsert из initData
- [x] `GET /api/admin/stats/summary` + `GET /api/admin/stats/users`
- [x] Admin «Обзор»: карточки + **таблица посетителей** (имя, @username, ID, first/last_seen)
- [x] Fix 404: admin вызывал `/stats/summary` → `/api/admin/stats/summary`

**Документация:** context, roadmap.html, api.md, user-guide, README

### Следующая сессия

1. **Merge + деплой** `work-doc-up` → `dev` → проверить «Обзор» в prod
2. **Фаза 5** — запись на приём (PRD-03)
3. M0 шаг 2 — `analytics_events` (по необходимости)

---

## M0 — что в коде

| API / UI | Статус |
|---|---|
| Upsert `telegram_users` | ✅ |
| `GET /api/admin/stats/summary` | ✅ |
| `GET /api/admin/stats/users` | ✅ |
| Admin `/dashboard` | ✅ |
| `analytics_events` | ❌ Фаза 6 |

---

## Backlog главной

- [ ] PRD-05 — баннер (текст / картинка / info-страница)
- [ ] CTA «Записаться» — после Фазы 5
- UI-02 NavGrid — не трогать

---

## Заметки

- Featured → draft сбрасывает featured
- Таблица «Обзор» пустая до визитов Mini App после деплоя server+012
