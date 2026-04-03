export function IconFirstAid() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="4" width="8" height="28" rx="3" fill="currentColor" />
      <rect x="4" y="14" width="28" height="8" rx="3" fill="currentColor" />
    </svg>
  );
}

export function IconDoctors() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Голова */}
      <circle cx="18" cy="10" r="6" fill="currentColor" />
      {/* Тело */}
      <path d="M6 30c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Стетоскоп */}
      <circle cx="26" cy="27" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M26 24v-4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function IconSchedule() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="28" height="24" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <path d="M4 15h28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 4v6M24 4v6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="22" r="2" fill="currentColor" />
      <circle cx="18" cy="22" r="2" fill="currentColor" />
      <circle cx="24" cy="22" r="2" fill="currentColor" />
      <circle cx="12" cy="28" r="2" fill="currentColor" />
      <circle cx="18" cy="28" r="2" fill="currentColor" />
    </svg>
  );
}

export function IconGrooming() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ножницы */}
      <circle cx="9" cy="27" r="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <path d="M12.5 12.5L27 27" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12.5 23.5L27 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
