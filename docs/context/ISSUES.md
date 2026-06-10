# Известные проблемы и техдолг

> Последнее обновление: 2026-06-10 (передача, VK auth + APK)

Легенда: 🔴 P0 · 🟠 P1 · 🟡 P2 · ⚪ P3

## Безопасность

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| SEC-01 | 🔴 | RBAC на бэкенде неполный | **fixed 2026-05-30** |
| SEC-02 | 🔴 | Update/delete без clinic_id | **fixed 2026-05-30** |
| SEC-03 | 🟠 | CORS `*` | **fixed 2026-05-30** |
| SEC-04 | 🟠 | JWT в localStorage (XSS surface) | **fixed 2026-05-31** — httpOnly cookie + `/api/admin/me` |
| SEC-05 | 🟠 | Rate limit на login | **fixed 2026-05-30** |
| SEC-06 | 🟡 | Загрузка файлов — только по расширению | **fixed 2026-05-31** — sniff MIME + проверка расширения |
| SEC-07 | 🟡 | Telegram initData не валидируется | **fixed** (work-audit-clear) |

## Инфра / CI

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| INF-01 | 🟠 | Нет CI quality gate (test/lint/build) на PR | **fixed** — `ci.yml` |
| INF-02 | 🟡 | `deploy-app.yml` не следит за `packages/cat/**` | **fixed** (пакет больше не в Mini App) |
| INF-03 | ⚪ | Дублирующие workflows в `apps/*/.github/` | **fixed 2026-05-31** — удалены |
| INF-04 | ⚪ | `turbo: "latest"` не закреплён | **fixed 2026-05-31** — `2.8.21` |
| UI-01 | ⚪ | Dreamstime PNG в SVG-ассетах меню | **fixed** — inline SVG в `NavGrid/icons.tsx` |
| UI-02 | ⚪ | Выравнивание заголовков NavGrid при разной длине подписи | **deferred** — костыль: короткие подписи в одну строку |
| UI-03 | ⚪ | CatPreloader в Mini App | **fixed 2026-05-30** — зелёный CSS spinner |
| UI-04 | ⚪ | Картинка кота в блоке «О нас» на главной | **fixed 2026-05-30** |
| UI-05 | 🟡 | Прочие UI-правки по фидбеку заказчика | **fixed 2026-05-31** — новых пунктов нет |

## Документация

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| DOC-01 … DOC-05 | — | См. audit.md | **fixed 2026-05-30** |
| DOC-06 | — | Roadmap + audit после hardening | **fixed 2026-05-30** |
| DOC-07 | 🟡 | Docs-портал сломан после переезда VPS | **fixed 2026-06-09** — nginx+cert на `213.176.65.71`; см. [docs-portal-restore.md](../md/general/docs-portal-restore.md) |

## Продукт (из roadmap)

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| PRD-01 | 🔴 | Скрыть груминг если раздел пустой | **fixed** (work-audit-clear) |
| PRD-02 | 🟡 | Пересмотр архитектуры статей | **fixed** — животное → статьи, slug auto, prod |
| PRD-03 | ⚪ | Запись на приём | **in progress** — C1 в коде на `dev`, prod после deploy app; [phase-5-appointments.md](../md/phases/phase-5-appointments.md) |
| PRD-04 | ⚪ | Аналитика (полная) | planned — **Фаза 6**; **M0 subset fixed в коде** — `telegram_users` + дашборд «Обзор» |
| PRD-05 | ⚪ | Концепция баннера (текст / текст+картинка / превью → info-страница) | planned |
| PRD-06 | ⚪ | Mobile app (Capacitor, «Ветпрактика», RuStore) | **in progress** — M0+M1+auth UI+VK в `work-mobile`; [design-mvp.md](../md/mobile/design-mvp.md) |
| PRD-07 | ⚪ | Featured-статьи на главной (до 3) | **fixed** — миграция 011, фаза 4 |
| PRD-08 | ⚪ | Polish главной (haptic, сегодня в клинике, sticky звонок, skeleton/fallback) | **fixed 2026-05-30** — в prod |
| PRD-09 | ⚪ | Карточка клиента со штрихкодом (бот + Mini App → mobile) | planned — **Фаза 8**; интеграция с БД клиники по запросу |

## Запись (PRD-03) — запланировано

| ID | Pri | Задача | Когда |
|---|---|---|---|
| PRD-03a | 🟠 | Антиспам: лимит заявок на `telegram_user_id` / телефон | **fixed 2026-06-01** — лимиты в `rules`, уникальность по кличке и слоту, настраиваемые потолки |

## Admin UI

| ID | Pri | Правило | Статус |
|---|---|---|---|
| ADM-01 | — | Все новые экраны admin: адаптация `< sm` | **правило** — `BookingScreen` 2026-05-31 |
| ADM-02 | ⚪ | Форма создания заявки в admin (сейчас только API) | backlog |

## Запись / API (фаза 5)

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| BOOK-01 | 🔴 | `loadScheduleData`: `d.name` вместо `doctors.full_name` → 500 календарь и POST заявки | **fixed в коде 2026-05-31** — ждёт Deploy server |
| BOOK-02 | 🟡 | Admin: ложная подсказка «миграции 013–015» при любой 500 | **fixed 2026-05-31** — текст из API |
| BOOK-03 | 🟡 | Admin: «Сохранить шаблон» без объяснения | **fixed 2026-05-31** — сравнение черновика + Alert |
| BOOK-04 | ⚪ | Admin: селект «Услуга» на вкладке заявок сжат | **fixed 2026-05-31** — FormControl+Select |
| INF-05 | 🟡 | CI lint падает, deploy всё равно идёт | **fixed 2026-06-01** — React Hooks v7 в admin |
| BOOK-05 | 🟡 | C1 Mini App — запись, слоты, отмена, UX | **fixed в коде 2026-06-01** — ждёт deploy app |
| BOOK-06 | 🟡 | Миграция `016_booking_schedule_style` | **в коде** — применить на VPS с deploy server |
| BOOK-07 | 🟡 | Бот без времени в уведомлениях | **fixed 2026-06-01** — deploy server |
| BOOK-08 | 🔴 | Отмена заявки из Mini App → 500 (`handled_by_user_id=0`) | **fixed 2026-06-01** — deploy server |
| BOOK-09 | ⚪ | C1: прошедшие слоты на сегодня; вкладки «Мои заявки» | **fixed 2026-06-01** — deploy app |
| QST-01 | ⚪ | «Задать вопрос» Mini App → чат врачей → ответ в бот | **fixed в коде 2026-06-01** — миграция **017**, deploy server+app |
| INF-06 | ⚪ | Мониторинг VPS/API в admin для superadmin | planned — [deployment.md](../md/general/deployment.md) § Идеи |
| INF-07 | ⚪ | Упрощённый error tracking (свой «мини-Sentry») | planned — fingerprint, booking/auth/upload |
| INF-08 | ⚪ | Роль `superadmin` (разработчик платформы) | planned — отдельно от `admin` клиники |
| INF-09 | 🟡 | Переезд VPS: IP `213.176.65.71` | **частично** — docs восстановлен; проверить `VPS_HOST` в GitHub Secrets + DNS остальных поддоменов |

## Mobile (PRD-06)

| ID | Pri | Задача | Статус |
|---|---|---|---|
| MOB-01 | 🟡 | M0: `/api/mobile/v1`, миграция 019, бот OTP | **fixed** — prod; фикс кнопки contact в `work-mobile` |
| MOB-02 | 🟡 | M1: `apps/mobile` shell, главная, tabs | **fixed в коде** — debug APK проверен |
| MOB-03 | 🟡 | Auth UI (login / verify / link-telegram) | **fixed в коде 2026-06-10** — merge `dev` + APK rebuild |
| MOB-04 | 🟡 | VK ID auth (`/auth/vk`, миграция 020) | **fixed в коде** — merge `dev`; `VK_APP_*` на VPS |
| MOB-05 | ⚪ | Booking flow в mobile | backlog sprint 5 |
| MOB-06 | ⚪ | RuStore release (M3) | backlog |
| MOB-07 | 🟡 | APK без `cap sync` → старый UI («sprint 4») | **doc** — всегда `npm run build` → `cap sync` перед APK |
| MOB-08 | 🟡 | `VITE_VK_APP_ID` — нужен числовой ID, не secret | **open** — проверить `.env.local` |

## Следующие шаги

1. Merge `work-mobile` → `dev` → Deploy server (020, VK, бот)
2. Исправить `VITE_VK_APP_ID`, пересобрать APK, smoke VK
3. Mobile sprint 2 (статьи)
4. **ADM-02** · C1 smoke
