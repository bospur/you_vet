const LOGIN_KEY = 'vp_admin_remember_login';
const REMEMBER_KEY = 'vp_admin_remember_me';

export function loadRememberedLogin(): string {
  try {
    return localStorage.getItem(LOGIN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function loadRememberPreference(): boolean {
  try {
    return localStorage.getItem(REMEMBER_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveRememberLogin(login: string, remember: boolean): void {
  try {
    if (remember) {
      localStorage.setItem(LOGIN_KEY, login.trim());
      localStorage.setItem(REMEMBER_KEY, '1');
    } else {
      localStorage.removeItem(LOGIN_KEY);
      localStorage.removeItem(REMEMBER_KEY);
    }
  } catch {
    // private mode / quota
  }
}
