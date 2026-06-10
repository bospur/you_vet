import { useState } from 'react';

const COLORS = [
  '#4CAF50', '#2196F3', '#9C27B0', '#FF5722',
  '#00BCD4', '#FF9800', '#E91E63', '#3F51B5',
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface DoctorAvatarProps {
  name: string;
  photoUrl?: string;
  size?: number;
}

export function DoctorAvatar({ name, photoUrl, size = 40 }: DoctorAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const letter = name.trim().charAt(0).toUpperCase();
  const bg = colorForName(name);
  const fontSize = Math.round(size * 0.42);

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}
