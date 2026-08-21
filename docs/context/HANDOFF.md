# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-08-21 (домен `bospur.ru` + портал + канбан + husky)

Ветка: **`work-doc-portal`** (синхрон с `origin`). В `dev` / prod портал попадёт после merge + push `dev`.

### Prod / smoke

| Проверка | Результат |
|---|---|
| DNS `api/admin/app/docs.bospur.ru` | ✅ `213.176.65.71` |
| HTTPS nginx | ✅ 200 admin/app/docs; API 404/405/initData |
| Certs Let's Encrypt | ✅ до 2026-11-19, webroot |
| `x-ui` / xray на `:443` | ✅ `disable --now x-ui` |
| GitHub `VITE_API_URL`, VPS `.env` | ✅ пользователь |
| Комментарии `/sales` | ✅ slug в `allowedDocSlugs` (нужен deploy server, если ещё не уехал) |
| Канбан колонки Анализ / Тестирование | 🟡 код + миграция **025** — нужен **deploy-server** |
| Pre-commit husky + lint-staged | ✅ в репо; после `npm install` |

### Сделано

**Инфра / домен**
- `*.snzbeachvolleyball25.ru` → `*.bospur.ru` (nginx на VPS, certs, CORS, cookie `.bospur.ru`, fallback URL, `deploy-docs.yml`).
- **appId** `ru.snzbeachvolleyball25.vetpraktika` **не** менять.
- На VPS `:443` был занят xray — выключен, nginx HTTPS.

**Портал `apps/docs` → https://docs.bospur.ru**
- Актуализация всех разделов + **[Продажи](https://docs.bospur.ru/sales)** (`docs/md/portal/sales.md`).
- Мобильная вёрстка: таблицы scroll, sticky header, 16px inputs, канбан кнопками.
- Комменты: общая сессия шапка ↔ форма (`VisitorProvider` / `visitor-context.ts`).
- Канбан: колонки **Анализ → К выполнению → В работе → Тестирование → Готова**; API `docs_tasks`; CORS к созданию с агента не относится (curl/API ок, браузер — origin `docs.bospur.ru`).
- CI lint: хук `useVisitor` вынесен из файла провайдера (`react-refresh/only-export-components`).
- Pre-commit: husky + lint-staged (eslint staged ts/tsx admin/app/docs/mobile).

### Не делать с агента без явной просьбы

Писать карточки на доску через prod API (общий стейт). CORS это не блокирует.

### Следующий шаг

1. Merge `work-doc-portal` → `dev` (если ещё не в prod): `deploy-docs` + `deploy-server` (slug `sales`, миграция 025).
2. BotFather Mini App URL + VK: `https://app.bospur.ru/vk-callback.html`.
3. APK: `VITE_API_URL=https://api.bospur.ru` → `npm run build` → `npx cap sync android`.
4. **Mobile sprint 5** — booking; C1 smoke Mini App; ADM-02.

### Ссылки

- Портал: https://docs.bospur.ru · `/sales` · `/board`
- [deployment.md](../md/general/deployment.md) · [sales.md](../md/portal/sales.md) · [development.md](../md/general/development.md) (pre-commit)
