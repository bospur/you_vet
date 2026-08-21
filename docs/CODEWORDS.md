# Кодовые слова для работы с документацией и AI

> Три короткие команды, чтобы не путать **контекст для AI**, **технические markdown** и **HTML-портал** для команды.  
> Портал: https://docs.bospur.ru · React-приложение `apps/docs` (workflow `deploy-docs.yml`).

---

## Три кодовых слова

| # | Слово | Когда говорить | Что делает AI |
|---|--------|----------------|---------------|
| 1 | **`контекст`** | Начало сессии, «напомни где мы» | Читает живую память и **маршрут** (см. ниже), кратко резюмирует |
| 2 | **`портал`** | После изменений для команды/клиники | Обновляет контент портала: md-файл + `apps/docs/src/pages.ts` при новой странице |
| 3 | **`передача`** | Конец сессии, «продолжим завтра» | Обновляет `docs/context/` (HANDOFF → STATUS → ISSUES), предлагает **`портал`** если менялось для людей |

Можно комбинировать: *«передача + портал запись»* — закрыть сессию и обновить HTML по фазе 5.

---

## 1. `контекст` — загрузить память AI

### Всегда читать (порядок)

1. [context/HANDOFF.md](./context/HANDOFF.md)
2. [context/STATUS.md](./context/STATUS.md)
3. [context/ISSUES.md](./context/ISSUES.md)
4. [context/PROJECT.md](./context/PROJECT.md)

### Маршрут (доп. файлы)

Укажите тему в том же сообщении: *«контекст запись»*, *«контекст деплой»*.

| Маршрут (ключевые слова) | Дополнительно читать |
|--------------------------|----------------------|
| *(по умолчанию)* | — |
| `запись`, `booking`, `фаза5`, `f5` | [md/phases/phase-5-appointments.md](./md/phases/phase-5-appointments.md) |
| `деплой`, `deploy`, `vps`, `ci` | [md/general/deployment.md](./md/general/deployment.md) |
| `роли`, `roles` | [md/general/roles.md](./md/general/roles.md) |
| `admin`, `админка` | [md/admin/architecture.md](./md/admin/architecture.md), [md/admin/user-guide.md](./md/admin/user-guide.md) |
| `app`, `мини`, `mini` | [md/app/overview.md](./md/app/overview.md) |
| `server`, `api`, `бот` | [md/server/overview.md](./md/server/overview.md), [md/server/api.md](./md/server/api.md) |
| `mobile`, `мобайл` | [md/mobile/overview.md](./md/mobile/overview.md), [md/mobile/roadmap.md](./md/mobile/roadmap.md) |
| `аудит`, `audit`, `безопасность` | [md/general/audit.md](./md/general/audit.md) |
| `дизайн`, `design` | [md/general/design-brief.md](./md/general/design-brief.md) |
| `архитектура` | [md/general/architecture.md](./md/general/architecture.md), [md/general/data-model.md](./md/general/data-model.md) |

**Не читать в `контекст`:** весь репозиторий подряд — только таблица выше.

---

## 2. `портал` — React-приложение docs.snz…

### Три слоя (не путать)

| Слой | Где | Кто читает | Влияет на сайт? |
|------|-----|------------|-----------------|
| Память AI | `docs/context/*.md` | AI (`контекст` / `передача`) | **Нет** |
| Техдоки | `docs/md/**/*.md` | AI, разработчики в IDE | **Да**, если файл подключён в `apps/docs/src/pages.ts` |
| Сайт | `apps/docs/` → build → VPS | Команда, клиника | **Да** после push `dev` |

`docs/html/` — **legacy**, больше не деплоится.

### Как контент попадает на сайт

Портал импортирует `.md` при сборке (`pages.ts`). Правка md **без** redeploy портала на prod **не видна** — нужен push → CI build `apps/docs`.

Интерактив (комментарии, канбан) — через API `/api/docs/v1/*`, без markdown.

### Чеклист для AI при `портал`

1. Обновить markdown в `docs/md/` (или `docs/md/portal/` для страниц только портала).
2. Если новая страница — добавить запись в `apps/docs/src/pages.ts` и карточку в `HomePage.tsx`.
3. `docs/context/` трогать только по **`передача`**, не по `портал`.

---

## 3. `передача` — сохранить конец сессии

### Всегда обновить

| Файл | Что писать |
|------|------------|
| `context/HANDOFF.md` | Сделано, prod/деплой, следующие шаги, команды/фиксы |
| `context/STATUS.md` | Таблицы prod и фокус |
| `context/ISSUES.md` | Новые/закрытые ID (BOOK-*, INF-*, …) |

### По необходимости

- `context/PROJECT.md` — смена фазы, стека, URL.
- Технические md (`md/phases/`, `md/general/deployment`, `md/server/api`) — если менялось поведение.
- **`портал`** — если менялось то, что читает клиника/команда в браузере.

### Деплой

Обычно **достаточно push в `dev`** — см. [md/general/deployment.md](./md/general/deployment.md). VPS вручную только при сбое Actions.

---

## Шпаргалка (копировать в чат)

```
контекст              → начало, HANDOFF + STATUS + ISSUES
контекст запись       → + md/phases/phase-5
контекст деплой       → + md/general/deployment

портал запись         → phase-5 .md (+ pages.ts если новая страница)

передача              → закрыть сессию, обновить context/
передача портал запись → передача + синхрон HTML
```

---

## Где что лежит (чтобы не путать)

| Что | Где | Кто читает |
|-----|-----|------------|
| Память между сессиями AI | `docs/context/*.md` | AI, вы (`контекст` / `передача`) |
| Техдоки разработки | `docs/md/**/*.md` | AI, разработчики |
| Сайт документации | `apps/docs/` | Команда, клиника (`портал`) |
| Legacy HTML | `docs/html/*.html` | *(не деплоится)* |

См. также [context/README.md](./context/README.md), [README.md](./README.md), [md/README.md](./md/README.md).
