import type { ReactNode } from 'react';

interface NavIconProps {
  children: ReactNode;
}

function NavIcon({ children }: NavIconProps) {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconFirstAid() {
  return (
    <NavIcon>
      <path
        d="M32 50c0 0-18-12-18-22 0-6 4-10 10-10 4 0 7 3 8 7 1-4 4-7 8-7 6 0 10 4 10 10 0 10-18 22-18 22z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </NavIcon>
  );
}

export function IconDoctors() {
  return (
    <NavIcon>
      <circle cx="32" cy="18" r="8" fill="currentColor" />
      <path
        d="M14 52c0-9.941 8.059-18 18-18s18 8.059 18 18"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </NavIcon>
  );
}

export function IconSchedule() {
  return (
    <NavIcon>
      <rect x="10" y="14" width="44" height="40" rx="5" stroke="currentColor" strokeWidth="3" />
      <path d="M10 26h44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 8v10M42 8v10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="22" cy="36" r="3" fill="currentColor" />
      <circle cx="32" cy="36" r="3" fill="currentColor" />
      <circle cx="42" cy="36" r="3" fill="currentColor" />
      <circle cx="22" cy="46" r="3" fill="currentColor" />
      <circle cx="32" cy="46" r="3" fill="currentColor" />
    </NavIcon>
  );
}

export function IconGrooming() {
  return (
    <NavIcon>
      <circle cx="16" cy="48" r="6" stroke="currentColor" strokeWidth="3" />
      <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="3" />
      <path d="M20 20L48 48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 44L48 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </NavIcon>
  );
}
