# Кодовые слова для работы с документацией и AI

> Три короткие команды, чтобы не путать **контекст для AI**, **технические markdown** и **HTML-портал** для команды.  
> Портал: https://docs.snzbeachvolleyball25.ru · в prod уходит только `docs/*.html` (workflow `deploy-docs.yml`).

---

## Три кодовых слова

| # | Слово | Когда говорить | Что делает AI |
|---|--------|----------------|---------------|
| 1 | **`контекст`** | Начало сессии, «напомни где мы» | Читает живую память и **маршрут** (см. ниже), кратко резюмирует |
| 2 | **`портал`** | После изменений для команды/клиники | Синхронизирует **markdown ↔ HTML** по таблице маршрутов, правит `index.html` при новой странице |
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
| `запись`, `booking`, `фаза5`, `f5` | [phase-5-appointments.md](./phase-5-appointments.md) |
| `деплой`, `deploy`, `vps`, `ci` | [deployment.md](./deployment.md) |
| `роли`, `roles` | [roles.md](./roles.md) |
| `admin`, `админка` | [admin/architecture.md](./admin/architecture.md), [admin/user-guide.md](./admin/user-guide.md) |
| `app`, `мини`, `mini` | [app/overview.md](./app/overview.md) |
| `server`, `api`, `бот` | [server/overview.md](./server/overview.md), [server/api.md](./server/api.md) |
| `mobile`, `мобайл` | [mobile/overview.md](./mobile/overview.md), [mobile/roadmap.md](./mobile/roadmap.md) |
| `аудит`, `audit`, `безопасность` | [audit.md](./audit.md) |
| `дизайн`, `design` | [design-brief.md](./design-brief.md) |
| `архитектура` | [architecture.md](./architecture.md), [data-model.md](./data-model.md) |

**Не читать в `контекст`:** весь репозиторий подряд — только таблица выше.

---

## 2. `портал` — markdown + HTML для docs.snz…

### Правило

- **Markdown** (`docs/**/*.md`) — для разработчиков и AI, в HTML-портал **не деплоится**.
- **HTML** (`docs/*.html`) — то, что видит команда и клиника после push в `dev` (`docs/**` → `deploy-docs.yml`).

При **`портал`**: обновить **и** источник (md), **и** страницу портала (html) в одном стиле с соседними файлами.

### Маршруты md → html

| Маршрут | Markdown (источник правды) | HTML (портал) |
|---------|------------------------------|---------------|
| `запись`, `фаза5` | `phase-5-appointments.md` | `phase-5-appointments.html` |
| `клиника`, `booking-clinic` | *(часто только HTML)* | `booking-for-clinic.html` — сверить с md фазы 5 / решениями |
| `roadmap` | `docs/roadmap` в md нет единого файла — править | `roadmap.html` |
| `аудит` | `audit.md` | `audit.html` |
| `дизайн` | `design-brief.md` | `design-brief.html` |
| `мобайл` | `mobile/*.md` | `mobile.html` |
| `dev`, `проект` | `architecture.md`, `README.md` | `project-for-devs.html` |
| `деплой` | `deployment.md` | *(страницы нет — при крупных изменениях добавить блок в `project-for-devs.html` или завести `deployment.html`)* |

### Чеклист для AI при `портал`

1. Определить маршрут из сообщения (как в таблице).
2. Обновить markdown.
3. Перенести смысл в HTML (заголовки, таблицы, статусы, даты «обновлено …»).
4. Проверить ссылки на `index.html` и «назад» (`← Все документы`).
5. Напомнить: после merge в `dev` портал обновится сам; локально HTML не откроется на prod без push.

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
- Технические md (`phase-5`, `deployment`, `server/api`) — если менялось поведение.
- **`портал`** — если менялось то, что читает клиника/команда в браузере.

### Деплой

Обычно **достаточно push в `dev`** — см. [deployment.md](./deployment.md). VPS вручную только при сбое Actions.

---

## Шпаргалка (копировать в чат)

```
контекст              → начало, HANDOFF + STATUS + ISSUES
контекст запись       → + phase-5
контекст деплой       → + deployment

портал запись         → phase-5 .md + .html, при необходимости booking-for-clinic.html
портал аудит          → audit.md + audit.html

передача              → закрыть сессию, обновить context/
передача портал запись → передача + синхрон HTML
```

---

## Где что лежит (чтобы не путать)

| Что | Где | Кто читает |
|-----|-----|------------|
| Память между сессиями AI | `docs/context/*.md` | AI, вы (`контекст` / `передача`) |
| Техдоки разработки | `docs/**/*.md` | AI, разработчики |
| Сайт документации | `docs/*.html` | Команда, клиника (`портал`) |

См. также [context/README.md](./context/README.md), [README.md](./README.md).
