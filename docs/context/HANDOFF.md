# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-08-21 (домен bospur.ru + документация + продажи)

### Prod / smoke

| Проверка | Результат |
|---|---|
| DNS `api/admin/app/docs.bospur.ru` | ✅ `213.176.65.71` |
| HTTPS nginx (admin, app, docs) | ✅ 200 |
| API `https://api.bospur.ru/` | ✅ 404 корень / 405 login HEAD / initData на clinic-info |
| Let's Encrypt | ✅ до 2026-11-19, webroot + auto-renew |
| x-ui / xray на `:443` | ✅ `disable --now x-ui` — порт отдан nginx |
| GitHub `VITE_API_URL`, VPS `.env` | ✅ пользователь поправил |
| Документация на стенде | 🟡 после push `dev` (этот diff) |

### Сделано

- Домен: `*.snzbeachvolleyball25.ru` → `*.bospur.ru` (nginx, certs, CORS, cookie, fallback URL, workflow docs).
- **appId** `ru.snzbeachvolleyball25.vetpraktika` не меняли.
- Портал: актуализация всех разделов + страница **Продажи** (`/sales`).

### Следующий шаг

1. Push `dev` → `deploy-docs` (и server/admin/app, если ещё не уехали с новым URL).
2. BotFather Mini App URL + VK кабинет: `https://app.bospur.ru/vk-callback.html`.
3. APK: `VITE_API_URL=https://api.bospur.ru` → `npm run build` → `cap sync android`.
4. Mobile sprint 5 — booking; C1 smoke Mini App; ADM-02.

### Ссылки

- Портал: https://docs.bospur.ru · продажи: `/sales`
- [deployment.md](../md/general/deployment.md) · [sales.md](../md/portal/sales.md)
