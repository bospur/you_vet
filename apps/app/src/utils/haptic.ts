export function hapticLight() {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
  } catch {
    // Telegram API may be unavailable outside the client
  }
}
