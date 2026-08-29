# Handoff — последняя сессия

> Обновляй в конце каждой сессии. AI читает первым.

## Сессия 2026-08-29 вечер (PWA в prod + макеты десктопа)

Ветка: **`work-web`**, дерево **чистое**. HEAD совпадает с локальным `origin/dev` (`806038f`, в т.ч. PR #87 + `40dd28c` `feat(web): Партировка мобилки в веб для pwa`). Пользователь пушил — **CI/deploy-web ок**.

### Prod

| Проверка | Результат |
|---|---|
| https://web.bospur.ru | ✅ nginx + Let's Encrypt (до 2026-11-27), каталог `/var/www/you-vet-web`, owner `deploy` |
| `deploy-web.yml` | ✅ отработал |
| CORS `.env` на VPS | ✅ `…,https://docs.bospur.ru,https://web.bospur.ru` + `docker compose up -d` |
| Десктоп UI | 🟡 живой, но «как админка» (левый сайдбар) |
| VK на web | 🟡 кабинет + Secret `VITE_VK_APP_ID` — уточнить в след. сессии |

Mini App `app.bospur.ru` не трогали. `apps/mobile` (Capacitor) **frozen**.

### Десктоп — Figma (личная команда, не MIURA.ONE)

Файл: [Ветпрактика — десктоп PWA](https://www.figma.com/design/sMWwSXhSPFammPut7NqIcN)  
`fileKey`: `sMWwSXhSPFammPut7NqIcN` · план `team::1030468518190190703` («Иван Семёнов's team», Starter Full).

| Кадр | Идея |
|---|---|
| **A** `1:2` | Телефон на столе: sage-фон, колонка ~390px, таббар |
| **B** `1:3` | Сайт клиники: верхняя шапка, hero, 3 плитки, без сайдбара |

Выбор A / B / смесь **не сделан**. В след. сессии — выбрать и верстать в `apps/web` (можно без новых read в Figma MCP).

**Квота MCP:** запись (`use_figma`, `create_new_file`) не лимитируется; чтение на Starter ~**20/мес**. Не класть файл в команду **MIURA.ONE**.

### Не делать с агента без явной просьбы

- SSH / команды на VPS.
- Коммитить / push.
- Писать макеты в рабочий Figma MIURA.ONE.

### Следующий шаг

1. Выбрать каркас десктопа (A / B / смесь) → править шелл в `apps/web` (≥900px), убрать ощущение админки.
2. Push `dev` → `deploy-web`; установленное PWA подтянет JS после закрытия/повторного открытия окна.
3. VK web origin/redirect; booking (C1) в PWA; C1 smoke Mini App.

### Ссылки

- PWA: https://web.bospur.ru
- Figma: https://www.figma.com/design/sMWwSXhSPFammPut7NqIcN
- [deployment.md](../md/general/deployment.md) · [overview.md](../md/mobile/overview.md)

---

## Ранее 2026-08-29 (появление `apps/web`)

Сторы frozen. Клиент вне Telegram — `@you-vet/web`, не Capacitor. Nginx-сниппет только в deployment.md (не в `apps/server/nginx/`).
