# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-08-21 вечер (канбан: ссылка на задачу `?task=`)

Ветка: **`work-doc-portal`** (синхрон с `origin/work-doc-portal`). Рабочее дерево **чистое**.

Последний коммит: `37d5c7b` `feat(портал): Маршруты для задач`.

В `dev` / prod портала этого ещё нет — нужен merge `work-doc-portal` → `dev` → Actions (`deploy-docs` + `deploy-server` для миграций **025+026**).

### Prod / smoke

| Проверка | Результат |
|---|---|
| DNS / HTTPS `*.bospur.ru` | ✅ |
| Комменты: правка и удаление | 🟡 в коде; вход с тем же именем восстанавливает visitor |
| Канбан теги / описание / фильтр / шторка | 🟡 код + миграция **026** — нужен **deploy-server** |
| Канбан колонки Анализ / Тестирование | 🟡 миграция **025** |
| Ссылка на задачу `?task=` | 🟡 в коде (`37d5c7b`), на prod после merge |

### Сделано в этой сессии (портал `/board`)

**Deep-link задачи**
- Открытая карточка синхронизируется с query: `/board?task=123`.
- Источник правды — `useSearchParams` (`parseTaskId` в `BoardPage.tsx`). Локального `openId` state нет.
- Закрытие модалки снимает `task` (`replace: true`). Несуществующий id после загрузки → ошибка «Задача не найдена или удалена» и сброс query.
- Название карточки и иконка «открыть» — `<Link to={{ pathname: '/board', search: '?task=…' }}>` (можно копировать адрес ссылки из контекстного меню).
- В футере модалки кнопка «скопировать ссылку» (`CopyTaskLinkButton`, иконка цепочки → галочка).
- После создания задачи URL сразу ставит `?task=` новой карточки.
- «Новая задача» query не использует (только локальный `creating`).

**UX канбана (уже в ветке, коммиты `bba3c17` и раньше)**
- Создание задачи — модалка `CreateTaskModal`, не форма на доске.
- `BoardDrawer`: десктоп-модалка, на телефоне шторка; drag handle, fullscreen, scroll lock (`html.board-drawer-open`).
- Кастомный `Select` (`apps/docs/src/components/ui/Select.tsx`): portal в `document.body`, backdrop + capture `pointerdown` (иначе drawer глотает клик-снаружи). `multiple` для тегов.
- Теги «Для кого» — **мультивыбор** (`TAG_OPTIONS`: management / development / customer). Пусто = «Не указано».
- Навигация колонок ≤1100px: пилюли + шевроны, sync со скроллом `data-board-col`.
- Оптимистичный PATCH карточки (без глобального `busy`).
- Правка описания — карандаш; отмена — secondary button.
- Иконки `react-icons/lu`.

**Комментарии / API (ранее в ветке)**
- Изменить / Удалить коммент; повторный вход с тем же именем → тот же visitor.
- `docs_tasks.description`, `docs_tasks.tags`. Миграции **025** (колонки), **026** (теги + сиды).

### Файлы

- `apps/docs/src/components/BoardPage.tsx` — доска, query `?task=`, модалки
- `apps/docs/src/components/ui/Select.tsx` — селект
- `apps/docs/src/components/ui/BoardDrawer.tsx` — шторка/модалка
- `apps/docs/src/board.ts` — колонки, приоритеты, теги
- `apps/docs/src/styles/global.css`

### Не делать с агента без явной просьбы

- SSH / команды на VPS.
- Писать карточки на доску через prod API (общий стейт).
- Коммитить / push, пока пользователь не попросил.

### Следующий шаг

1. Merge `work-doc-portal` → `dev` → дождаться `deploy-docs` + `deploy-server` (**025+026**).
2. Проверить https://docs.bospur.ru/board : фильтр, шторка, сиды, открыть карточку и скинуть `?task=`.
3. BotFather Mini App URL + VK: `https://app.bospur.ru/vk-callback.html`.
4. APK: `VITE_API_URL=https://api.bospur.ru` → `npm run build` → `npx cap sync android`.
5. **Mobile sprint 5** — booking; C1 smoke; ADM-02.

### Ссылки

- Портал: https://docs.bospur.ru · `/sales` · `/board?task=<id>`
- [roadmap.md](../md/portal/roadmap.md) · [sales.md](../md/portal/sales.md) · [deployment.md](../md/general/deployment.md)
