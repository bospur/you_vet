# Ветпрактика — Mobile App (Capacitor)

Отдельное Android/iOS приложение. API: `/api/mobile/v1/…`

## Быстрый старт (веб)

```bash
# из корня монорепо
npm install
cp apps/mobile/.env.example apps/mobile/.env.local

npm run dev --workspace=@you-vet/mobile
# http://localhost:5175
```

## Capacitor (Android)

```bash
cd apps/mobile
npm run build
npx cap add android   # один раз
npx cap sync
npx cap open android
```

`appId`: `ru.snzbeachvolleyball25.vetpraktika`

## Документация

- `docs/md/mobile/design-mvp.md`
- `docs/md/mobile/screen-specs.md`
