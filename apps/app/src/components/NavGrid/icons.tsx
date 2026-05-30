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
      <rect x="12" y="10" width="40" height="44" rx="6" stroke="currentColor" strokeWidth="3" />
      <path
        d="M32 22v20M22 32h20"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
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
      <circle cx="46" cy="46" r="5" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M46 41V32h-8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
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
