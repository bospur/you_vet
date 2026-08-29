import { useEffect, useState } from 'react';
import {
  dismissInstallBanner,
  isInstallDismissed,
  isIosSafari,
  isStandaloneDisplay,
} from '../lib/pwa';
import styles from './InstallBanner.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function initiallyHidden(): boolean {
  return isStandaloneDisplay() || isInstallDismissed();
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(initiallyHidden);
  const iosHint = !dismissed && isIosSafari();

  useEffect(() => {
    if (dismissed) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, [dismissed]);

  if (dismissed || (!iosHint && !deferred)) return null;

  const close = () => {
    dismissInstallBanner();
    setDismissed(true);
    setDeferred(null);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    close();
  };

  return (
    <div className={styles.banner} role="status">
      <p className={styles.text}>
        {iosHint
          ? 'На iPhone: Поделиться → На экран «Домой»'
          : 'Установите «Ветпрактика» на устройство'}
      </p>
      <div className={styles.actions}>
        {deferred && (
          <button type="button" className={styles.install} onClick={() => void install()}>
            Установить
          </button>
        )}
        <button type="button" className={styles.dismiss} onClick={close} aria-label="Закрыть">
          Не сейчас
        </button>
      </div>
    </div>
  );
}
