interface TelegramBackButton {
  isVisible: boolean;
  show(): void;
  hide(): void;
  onClick(fn: () => void): void;
  offClick(fn: () => void): void;
}

interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
}

interface TelegramWebApp {
  initData: string;
  colorScheme: 'light' | 'dark';
  BackButton: TelegramBackButton;
  HapticFeedback: TelegramHapticFeedback;
  ready(): void;
  expand(): void;
  close(): void;
  onEvent(event: string, fn: () => void): void;
  offEvent(event: string, fn: () => void): void;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
