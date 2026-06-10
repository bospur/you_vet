import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vkCallbackSearchFromUrl } from './vkLogin';

/** Перехватывает deep link VK после OAuth на Android/iOS. */
export function VkDeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const openCallback = (url: string) => {
      const search = vkCallbackSearchFromUrl(url);
      if (search !== null) {
        navigate(`/auth/vk-callback${search}`, { replace: true });
      }
    };

    void CapApp.getLaunchUrl().then((result) => {
      if (result?.url) {
        openCallback(result.url);
      }
    });

    const sub = CapApp.addListener('appUrlOpen', ({ url }) => {
      openCallback(url);
    });

    return () => {
      void sub.then((handle) => handle.remove());
    };
  }, [navigate]);

  return null;
}
