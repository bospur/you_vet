const iconProps = {
  width: 72,
  height: 72,
  viewBox: '0 0 72 72',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
} as const;

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 2.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconFirstAid() {
  return (
    <svg {...iconProps}>
      <rect x="18" y="24" width="36" height="32" rx="4" {...stroke} />
      <path d="M36 32v16M28 40h16" {...stroke} />
      <path d="M28 24V20a8 8 0 0116 0v4" {...stroke} />
    </svg>
  );
}

export function IconSchedule() {
  return (
    <svg {...iconProps}>
      <rect x="14" y="18" width="44" height="40" rx="4" {...stroke} />
      <path d="M14 30h44M26 12v8M46 12v8" {...stroke} />
      <circle cx="26" cy="40" r="2.5" fill="currentColor" />
      <circle cx="36" cy="40" r="2.5" fill="currentColor" />
      <circle cx="46" cy="40" r="2.5" fill="currentColor" />
      <circle cx="26" cy="50" r="2.5" fill="currentColor" />
      <circle cx="36" cy="50" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function IconGrooming() {
  return (
    <svg {...iconProps}>
      <circle cx="22" cy="50" r="6" {...stroke} />
      <circle cx="22" cy="22" r="6" {...stroke} />
      <path d="M26 26l30 30M26 46l30-30" {...stroke} />
    </svg>
  );
}
