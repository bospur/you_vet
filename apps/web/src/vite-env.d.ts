/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CLINIC_SLUG: string;
  readonly VITE_BOT_USERNAME: string;
  readonly VITE_MOBILE_API_PREFIX: string;
  readonly VITE_VK_APP_ID?: string;
  readonly VITE_VK_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
