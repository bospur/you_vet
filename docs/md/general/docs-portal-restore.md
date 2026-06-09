# Восстановление docs-портала (docs.snzbeachvolleyball25.ru)

> Статус диагностики: **2026-06-09** — портал сломан после переезда.

## Симптомы (что видим сейчас)

| Проверка | Ожидание | Факт |
|---|---|---|
| `https://docs.snzbeachvolleyball25.ru/` | HTML-портал (`index.html`, roadmap…) | Отдаётся **admin SPA** (`vp-bot-admin`) |
| SSL-сертификат | `CN=docs.snzbeachvolleyball25.ru` | Сертификат **admin.snzbeachvolleyball25.ru** |
| `curl` без `-k` | Успех | **Ошибка SSL** (hostname mismatch) |

**Вывод:** Nginx для поддомена `docs` **не включён** (`sites-enabled` только admin, api, app). Запросы на `docs.*` попадают в default HTTPS vhost → admin. TLS для `docs` не выпущен.

**На VPS уже есть контент:** `/var/www/you-vet-docs/index.html` (деплой CI 2026-06-09). Нужны только Nginx + сертификат.

### Быстрый фикс (выполняете вы на VPS вручную)

> **Порядок важен:** сначала HTTP + acme в Nginx, **потом** certbot, **потом** полный конфиг с HTTPS.  
> Иначе certbot получит 404, а `nginx -t` упадёт из‑за отсутствующих `.pem`.

**С локальной машины** (из клона репо `you_vet`):

```bash
scp apps/server/nginx/docs.conf root@213.176.65.71:/tmp/docs.conf
scp -r docs/html/* root@213.176.65.71:/var/www/you-vet-docs/
```

**На VPS (root или sudo):**

```bash
# 0. Убрать битый symlink, если создавали раньше
sudo rm -f /etc/nginx/sites-enabled/docs.conf

# 1. Каталоги
sudo mkdir -p /var/www/you-vet-docs /var/www/certbot
sudo chown -R deploy:deploy /var/www/you-vet-docs   # или www-data — как у admin/app

# 2. Временный ТОЛЬКО-HTTP конфиг (без SSL-блока — сертификата ещё нет)
sudo tee /etc/nginx/sites-available/docs.conf <<'EOF'
server {
    listen 80;
    server_name docs.snzbeachvolleyball25.ru;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        root /var/www/you-vet-docs;
        index index.html;
        try_files $uri $uri/ =404;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/docs.conf /etc/nginx/sites-enabled/docs.conf
sudo nginx -t && sudo systemctl reload nginx

# 3. Проверка: challenge path отвечает (не 404)
curl -sI http://docs.snzbeachvolleyball25.ru/ | head -3

# 4. Сертификат
sudo certbot certonly --webroot -w /var/www/certbot -d docs.snzbeachvolleyball25.ru

# 5. Полный конфиг из репо (HTTP→HTTPS + SSL)
sudo cp /tmp/docs.conf /etc/nginx/sites-available/docs.conf
sudo nginx -t && sudo systemctl reload nginx

# 6. Smoke
curl -sI https://docs.snzbeachvolleyball25.ru/ | head -5
curl -s https://docs.snzbeachvolleyball25.ru/ | head -5
```

Файл `~/docs.snzbeachvolleyball25.ru.conf` был залит на **старый** VPS под пользователем `deploy` — на новом хосте его нет, берите `apps/server/nginx/docs.conf` из репозитория.

Если certbot снова 404 — проверить DNS: `dig +short docs.snzbeachvolleyball25.ru` должен показывать IP **текущего** VPS.

## Как должно быть

| Параметр | Значение |
|---|---|
| Домен | `docs.snzbeachvolleyball25.ru` |
| Nginx `root` | `/var/www/you-vet-docs` |
| Содержимое | Статика из репо `docs/html/*` |
| Деплой | GitHub Actions `deploy-docs.yml` на push `dev` + `docs/**` |
| Конфиг в репо | `apps/server/nginx/docs.conf` |

## Восстановление на VPS (пошагово)

Подключение: `ssh vps` (пользователь `deploy`, ключ `~/.ssh/vp_bot_deploy`).

### Шаг 1. Проверить, что каталог docs существует

```bash
ls -la /var/www/you-vet-docs/
```

Если пусто или нет `index.html` с YouVet-доками — нужен деплой (шаг 5).

Ожидаемый `index.html` начинается с чего-то вроде «YouVet» / ссылок на `roadmap.html`, **не** с `<title>vp-bot-admin</title>`.

### Шаг 2. Проверить Nginx-конфиги

```bash
sudo ls -la /etc/nginx/sites-enabled/
sudo grep -r "docs.snzbeachvolleyball25" /etc/nginx/sites-enabled/
```

Должен быть server block с:

- `server_name docs.snzbeachvolleyball25.ru;`
- `root /var/www/you-vet-docs;`

Если конфига нет — скопировать из репозитория:

```bash
# на VPS, из клона репо (или scp с локальной машины)
sudo cp /home/deploy/you_vet/apps/server/nginx/docs.conf \
  /etc/nginx/sites-available/docs.snzbeachvolleyball25.ru
sudo ln -sf /etc/nginx/sites-available/docs.snzbeachvolleyball25.ru \
  /etc/nginx/sites-enabled/docs.snzbeachvolleyball25.ru
```

> Если полного клона на VPS нет — скопировать файл с локальной машины:
> `scp apps/server/nginx/docs.conf vps:/tmp/docs.conf`
> затем на VPS: `sudo mv /tmp/docs.conf /etc/nginx/sites-available/...`

### Шаг 3. SSL для docs

Проверить наличие сертификата:

```bash
sudo ls /etc/letsencrypt/live/docs.snzbeachvolleyball25.ru/
```

Если каталога нет — выпустить (webroot как в admin/app):

```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d docs.snzbeachvolleyball25.ru
```

Убедиться, что в `docs.conf` пути к `fullchain.pem` и `privkey.pem` совпадают с выводом certbot.

### Шаг 4. Проверка и перезагрузка Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Шаг 5. Залить контент docs

**Вариант A — через CI (предпочтительно):**

1. Закоммитить любое изменение в `docs/html/` (или пустой touch) на ветке `dev`
2. Push → Actions → workflow **Deploy docs**
3. Проверить зелёный статус job

**Вариант B — вручную с локальной машины:**

```bash
cd /path/to/you_vet
scp -r docs/html/* vps:/var/www/you-vet-docs/
```

Workflow использует `strip_components: 2`, т.е. на сервере файлы лежат **прямо** в `/var/www/you-vet-docs/index.html`, без подпапки `html/`.

### Шаг 6. Smoke-тест

```bash
curl -sI https://docs.snzbeachvolleyball25.ru/ | head -5
curl -s https://docs.snzbeachvolleyball25.ru/ | head -20
curl -sI https://docs.snzbeachvolleyball25.ru/mobile.html | head -3
```

Успех:

- HTTP 200
- В теле — HTML документации, не React admin
- `openssl s_client … -servername docs…` → `CN=docs.snzbeachvolleyball25.ru`

## Частая причина поломки при переезде

При переносе VPS копируют только `admin` + `app` + Docker, а:

1. Не создают `/var/www/you-vet-docs`
2. Не копируют `docs.conf` в `sites-enabled`
3. Не выпускают отдельный сертификат для `docs.*`
4. Default server на 443 отдаёт admin — браузер попадает на admin даже по URL docs

## Автодеплой после восстановления

Файл: `.github/workflows/deploy-docs.yml`

- Триггер: push `dev`, paths `docs/**`
- Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (те же, что admin/app)

После починки Nginx достаточно push в `dev` — портал будет обновляться автоматически.

## Связанные документы

- [deployment.md](./deployment.md) — общая инфраструктура
- [CODEWORDS.md](../../CODEWORDS.md) — команда **`портал`** для синхронизации md ↔ html
