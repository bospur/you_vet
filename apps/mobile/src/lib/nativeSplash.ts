import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

export async function hideNativeSplash() {
  if (!Capacitor.isNativePlatform()) return;
  await SplashScreen.hide({ fadeOutDuration: 250 });
}
