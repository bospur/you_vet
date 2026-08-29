# Ветпрактика — веб / PWA

Клиентский сайт клиники: браузер, установка на домашний экран (Android / iOS Safari / десктоп). API тот же, что у замороженного Capacitor-приложения: `/api/mobile/v1`.

Не путать с Telegram Mini App (`apps/app`, `app.bospur.ru`).

```bash
cp .env.example .env.local
npm run dev --workspace=@you-vet/web   # http://localhost:5177
```

Prod: `https://web.bospur.ru` — workflow `deploy-web.yml` после push в `dev`. Nginx и сертификат на VPS настраиваются вручную, см. [deployment.md](../../docs/md/general/deployment.md).
