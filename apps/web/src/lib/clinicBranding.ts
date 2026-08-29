import type { ClinicInfo } from '@you-vet/types';
import { API_URL } from '../api/client';

function upsertLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function setMeta(name: string, content: string) {
  const el = document.querySelector(`meta[name="${name}"]`);
  if (el) el.setAttribute('content', content);
}

/** Favicon и title вкладки — из «О клинике». Иконка установленного PWA берётся из манифеста. */
export function applyClinicBranding(info: ClinicInfo | null) {
  if (!info) return;

  if (info.name) {
    document.title = info.name;
    setMeta('apple-mobile-web-app-title', info.name);
  }

  if (!info.logo_url) return;
  const href = `${API_URL}${info.logo_url}`;
  upsertLink('icon', href);
}
