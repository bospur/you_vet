# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-05-30 (UI)

**Ветка:** `work-ui` → merge в `dev` → deploy Mini App (`deploy-app.yml`)

### Сделано

- [x] Редизайн главной Mini App: `HomeHero`, `AppHeader`, обновлённые токены (`tokens.css`)
- [x] NavGrid: иконки из Figma → `apps/app/src/assets/menu/` (`arcticles`, `doctors`, `sheldue`, `gruming`)
- [x] Баннер: флаг `banner_enabled` в `clinic_info` (миграция 010), переключатель в admin (`ClinicInfoScreen`)
- [x] Удалены неиспользуемые ассеты (`hero.png`, `vite.svg`)

### Перед релизом

- [ ] Закоммитить `assets/menu/` + правки `icons.tsx` / `NavGrid.module.css` (если ещё не в ветке)
- [ ] PR `work-ui` → `dev`, merge → CI + deploy `apps/app`

### Следующая сессия

- [ ] PRD-03: запись на приём (фаза 4)
- [ ] SEC-04: JWT → httpOnly cookie (опционально)
- [ ] SEC-06: валидация загрузки по MIME
- [ ] Оптимизация `assets/menu/arcticles.svg` (~324 KB, embedded PNG) → чистый PNG

### Заметки

- CI: на PR — quality gate; после merge в `dev` — path-based deploy
- Prod Mini App: initData обязателен; локально `TELEGRAM_INITDATA_SKIP=1`
- Маппинг иконок: `arcticles` → Первая помощь, `doctors` → Наши врачи, `sheldue` → Расписание, `gruming` → Груминг

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
