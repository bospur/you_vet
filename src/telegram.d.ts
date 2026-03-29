interface TelegramBackButton {
  isVisible: boolean;
  show(): void;
  hide(): void;
  onClick(fn: () => void): void;
  offClick(fn: () => void): void;
}

interface TelegramWebApp {
  initData: string;
  colorScheme: 'light' | 'dark';
  BackButton: TelegramBackButton;
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
