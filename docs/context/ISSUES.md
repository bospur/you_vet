# Известные проблемы и техдолг

> Последнее обновление: 2026-08-29 (PWA `apps/web`, сторы frozen)

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
| INF-09 | 🟡 | Переезд VPS + домен `bospur.ru` | **fixed 2026-08-21** — DNS, certs, nginx HTTPS; x-ui снят с `:443` |
| INF-10 | ⚪ | Pre-commit не ловит eslint | **fixed 2026-08-21** — husky + lint-staged |

## Документационный портал

| ID | Pri | Проблема | Статус |
|---|---|---|---|
| DOC-08 | 🟡 | Коммент на `/sales` → «неизвестная страница» | **fixed** — `allowedDocSlugs` + `sales` |
| DOC-09 | ⚪ | Вход в комментариях не обновляет шапку | **fixed** — общий `VisitorProvider` |
| DOC-10 | ⚪ | Канбан: колонки Анализ / Тестирование | **in code** — миграция **025**, deploy server |
| DOC-11 | 🟡 | Комменты: пропали правка/удаление | **fixed в коде** — GetOrCreateVisitor + DELETE; deploy server+docs |
| DOC-12 | ⚪ | Канбан: теги, описание, фильтр, шторка, адаптив | **in code** — миграция **026**, deploy server+docs |
| DOC-13 | ⚪ | Канбан: шаринг карточки `/board?task=<id>` | **in code** — `37d5c7b`; deploy docs |
| WEB-01 | 🟡 | Выкладка PWA `web.bospur.ru` | **in code** — DNS, nginx на VPS, CORS `.env`, VK, `deploy-web` |

## Mobile (PRD-06)

| ID | Pri | Задача | Статус |
|---|---|---|---|
| MOB-01 | 🟡 | M0: `/api/mobile/v1`, миграция 019, бот OTP | **fixed** — prod; contact-кнопка в `work-mobile` |
| MOB-02 | 🟡 | M1: `apps/mobile` shell, главная, tabs | **fixed** — APK на телефоне |
| MOB-03 | 🟡 | Auth UI (login / verify / link-telegram) | **fixed 2026-06-10** — TG smoke ✅; `setTokens` в VerifyScreen |
| MOB-04 | 🟡 | VK ID auth (`/auth/vk`, миграция 020) | **fixed** — smoke ✅ на APK |
| MOB-05 | ⚪ | Booking flow в клиенте | backlog — делать в **`apps/web`**, не APK |
| MOB-06 | ⚪ | RuStore release (M3) | **frozen** |
| MOB-07 | 🟡 | APK без `cap sync` → старый UI | **doc** — `npm run build` → `cap sync` |
| MOB-08 | 🟡 | VK app ID / кабинет | **fixed** |
| MOB-09 | 🟡 | CORS / API из APK WebView | **fixed** — `CapacitorHttp` |
| MOB-10 | 🟡 | VK `user_info` без `client_id` | **fixed** — prod |
| MOB-11 | 🟡 | Admin: вкладка mobile в «Обзор» | **fixed 2026-06-10** — deploy admin |
| MOB-12 | 🟡 | Контент mobile (статьи, врачи, груминг…) | **fixed 2026-06-10** |
| MOB-13 | 🟡 | Вопрос из APK (ответ в TG) | **fixed** — `POST …/questions` mobile JWT |
| MOB-14 | 🟡 | ЛК: имя + фото (`photo_url`, 021) | **fixed** — deploy server |
| MOB-15 | 🟡 | Mobile UX polish (хедер, тема, 320px, врачи grid, splash) | **fixed 2026-06-10** — deploy APK |
| MOB-16 | 🟡 | Гостевой режим: скрыть запись/вопрос, баннер, экран входа | **fixed 2026-06-10** |
| MOB-17 | 🟡 | Session refresh + 401 → login (удаление user в admin) | **fixed 2026-06-10** — deploy server+mobile |
| MOB-18 | 🟡 | CI: `set-state-in-effect` в ProfileScreen | **fixed 2026-06-10** |
| MOB-19 | 🟡 | Android: duplicate `ic_launcher_background` | **fixed 2026-06-10** |
| MOB-20 | 🟡 | Admin: удаление mobile user | **fixed 2026-06-10** — deploy admin+server |
| MOB-21 | ⚪ | Логотип в AppBar обрезается (`object-fit: cover`) | **fixed 2026-06-10** — `contain` |
| MOB-22 | 🟡 | PNG-логотип в admin → чёрный фон (JPEG) | **fixed 2026-06-10** — `prepareLogoForUpload`; перезалить |
| MOB-23 | ⚪ | Промо-баннер на главной mobile | **fixed 2026-06-10** — `ClinicPromoBanner` |
| MOB-24 | ⚪ | Фото врачей разной высоты | **fixed 2026-06-10** — aspect-ratio + shadow |
| MOB-25 | 🟡 | «Вы вошли как VK 12345» на записи | **fixed 2026-06-10** — профиль API + server VK name |
| MOB-26 | ⚪ | CI: `useMemo` conditional в HomeScreen | **fixed 2026-06-10** |
| MOB-27 | ⚪ | iOS: Capacitor platform | **frozen** |

## Следующие шаги

1. Выкладка https://web.bospur.ru (DNS, nginx, CORS, VK, `deploy-web`)
2. Merge `work-doc-portal` → `dev` если канбан ещё не в prod (**025+026**, `?task=`)
3. Booking (C1) в PWA
4. **ADM-02** · C1 smoke Mini App
