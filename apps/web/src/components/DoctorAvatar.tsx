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
  variant?: 'circle' | 'square';
}

export function DoctorAvatar({
  name,
  photoUrl,
  size = 40,
  variant = 'circle',
}: DoctorAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const letter = name.trim().charAt(0).toUpperCase();
  const bg = colorForName(name);
  const isSquare = variant === 'square';
  const fontSize = isSquare ? 48 : Math.round(size * 0.42);
  const borderRadius = isSquare ? 0 : '50%';

  const sharedStyle = isSquare
    ? {
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto',
        borderRadius,
        objectFit: 'contain' as const,
        objectPosition: 'center',
        display: 'block',
      }
    : {
        width: size,
        height: size,
        borderRadius,
        objectFit: 'cover' as const,
        display: 'block',
        flexShrink: 0,
      };

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={sharedStyle}
        onError={() => setImgError(true)}
      />
    );
  }

  const fallbackStyle = isSquare
    ? {
        width: '56%',
        aspectRatio: '1',
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 32,
        fontWeight: 700,
        flexShrink: 0,
      }
    : {
        ...sharedStyle,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize,
        fontWeight: 700,
      };

  return (
    <div aria-hidden style={fallbackStyle}>
      {letter}
    </div>
  );
}
