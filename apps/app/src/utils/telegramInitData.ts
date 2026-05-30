/** initData как в window.Telegram.WebApp.initData (query string). */
export function getTelegramInitData(): string {
  const fromBridge = window.Telegram?.WebApp?.initData?.trim();
  if (fromBridge) {
    return fromBridge;
  }

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) {
    return '';
  }

  const params = new URLSearchParams(hash);
  const tgWebAppData = params.get('tgWebAppData');
  if (tgWebAppData) {
    return tgWebAppData;
  }

  return '';
}
