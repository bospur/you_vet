import type { ClinicInfo } from '@you-vet/types';

function setMeta(name: string, content: string) {
  const el = document.querySelector(`meta[name="${name}"]`);
  if (el) el.setAttribute('content', content);
}

/** Title вкладки — из «О клинике». Favicon остаётся квадратным `/favicon.png`. */
export function applyClinicBranding(info: ClinicInfo | null) {
  if (!info?.name) return;
  document.title = info.name;
  setMeta('apple-mobile-web-app-title', info.name);
}
