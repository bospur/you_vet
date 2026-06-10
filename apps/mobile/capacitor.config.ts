import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.snzbeachvolleyball25.vetpraktika',
  appName: 'Ветпрактика',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Нативный HTTP в WebView — без CORS (origin APK = https://localhost).
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
