# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-05-31 (техдолг + план Фазы 5)

**Ветка:** `work-F-5` · техдолг и docs **не в prod** — нужен деплой server + admin + docs

### Сделано

**Техдолг (кроме UI-02 NavGrid — deferred):**
- [x] SEC-04 — httpOnly cookie, `/api/admin/me`, `/api/admin/logout`
- [x] SEC-06 — MIME-валидация загрузок
- [x] INF-03 — удалены дубликаты workflows
- [x] INF-04 — turbo `2.8.21`
- [x] UI-05 — закрыт

**Документация + план Фазы 5:**
- [x] [phase-5-appointments.md](../phase-5-appointments.md) + [phase-5-appointments.html](../phase-5-appointments.html)
- [x] Roadmap.html — подфазы 5.0–5.6, PRD-05 вынесен отдельно
- [x] Context (STATUS, ISSUES, PROJECT), README, deployment

**Согласованный подход к записи (PRD-03):**
- Клиент: бот FSM + Mini App форма
- Staff: admin «Заявки» + бот whitelist для врачей (push без RuStore)
- Backend: `/api/v1/...`, `appointment_requests`, pending flow
- Детали UX — **следующая сессия** после анкеты директора

### Следующая сессия

1. **Деплой:** merge → server + admin + docs; VPS: `COOKIE_SECURE=1`, `COOKIE_DOMAIN=.snzbeachvolleyball25.ru`
2. **Анкета** директору → разбор ответов → финальный UX-flow (5.0)
3. **Код:** начать 5.1 — миграция + API заявок

---

## Фаза 5 — кратко

| Подфаза | Содержание |
|---|---|
| 5.0 | Анкета + UX |
| 5.1 | API v1, БД |
| 5.2 | Бот клиент |
| 5.3 | Mini App |
| 5.4 | Admin заявки |
| 5.5 | Staff-бот |
| 5.6 | Polish, деплой |

Полный план: [phase-5-appointments.md](../phase-5-appointments.md)

---

## M0 — prod

| API / UI | Статус |
|---|---|
| `telegram_users` + дашборд «Обзор» | ✅ |
| `analytics_events` | ❌ Фаза 6 |

---

## Backlog

- [ ] PRD-05 — баннер (не блокирует Фазу 5)
- [ ] CTA «Записаться» — часть 5.3
- UI-02 NavGrid — **deferred**

---

## Заметки

- Admin после деплоя: перелогиниться (cookie вместо localStorage)
- Анкета: https://docs.snzbeachvolleyball25.ru/registration-phase-survey.html
- План Ф5: https://docs.snzbeachvolleyball25.ru/phase-5-appointments.html
