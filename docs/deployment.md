# Деплой

## Автоматический (CI/CD)

Push в ветку `dev` → GitHub Actions автоматически:
1. Устанавливает зависимости (`npm ci`)
2. Собирает проект (`npm run build` с env из secrets)
3. Копирует `dist/` на VPS через scp

**Файл:** `.github/workflows/deploy.yml`

## GitHub Secrets

Настраиваются в: репо → Settings → Secrets and variables → Actions

| Secret | Значение |
|--------|----------|
| `VPS_HOST` | `194.87.0.94` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | приватный SSH ключ (`~/.ssh/vp_bot_deploy`) |
| `VITE_API_URL` | `https://api.snzbeachvolleyball25.ru` |
| `VITE_CLINIC_SLUG` | `default` |

## Nginx на VPS

Конфиг: `/etc/nginx/sites-available/admin.snzbeachvolleyball25.ru`
Исходник: `nginx/admin.conf` в репозитории.

Статика раздаётся из `/var/www/vp-bot-admin/`.
Все маршруты проксируются на `index.html` (SPA).
Ассеты с хешем в имени кешируются на 1 год (`Cache-Control: immutable`).

## Ручной деплой (если нужно)

```bash
npm run build
rsync -avz --delete dist/ deploy@194.87.0.94:/var/www/vp-bot-admin/
```

## Первая настройка на новом сервере

```bash
# 1. Создать директорию
sudo mkdir -p /var/www/vp-bot-admin
sudo chown -R deploy:deploy /var/www/vp-bot-admin

# 2. Скопировать и включить nginx конфиг
sudo cp nginx/admin.conf /etc/nginx/sites-available/admin.snzbeachvolleyball25.ru
sudo ln -s /etc/nginx/sites-available/admin.snzbeachvolleyball25.ru /etc/nginx/sites-enabled/

# 3. Временный HTTP конфиг для получения сертификата (убрать SSL блок)
sudo nginx -t && sudo systemctl reload nginx

# 4. Получить SSL сертификат
sudo mkdir -p /var/www/certbot
sudo certbot certonly --webroot -w /var/www/certbot -d admin.snzbeachvolleyball25.ru

# 5. Вернуть полный конфиг со SSL, перезапустить
sudo nginx -t && sudo systemctl reload nginx
```
