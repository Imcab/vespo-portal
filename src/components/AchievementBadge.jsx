import { Lock } from 'lucide-react';
import { resolveIcon, iconLibraryOf, useTablerReady } from '../utils/icons';
import { shadeColor } from '../utils/color';
import { RARITY_COLOR } from '../utils/rarity';

export default function AchievementBadge({ icono, color, locked = false, size = 56, nivel, count = 0 }) {
  useTablerReady(iconLibraryOf(icono) === 'tabler');
  const Icon = resolveIcon(icono);
  const iconColor = shadeColor(color);
  const ringColor = nivel ? RARITY_COLOR[nivel] : null;

  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full transition-[filter,opacity] duration-350 ease-emil"
      style={{
        width: size,
        height: size,
        backgroundColor: locked ? '#d9d5cc' : color,
        filter: locked ? 'grayscale(1)' : 'none',
        opacity: locked ? 0.55 : 1,
        boxShadow: ringColor
          ? `0 0 0 3px ${ringColor}, 0 0 0 4.5px white, 0 0 0 6px ${ringColor}55`
          : 'none',
      }}
    >
      {/* eslint-disable-next-line react-hooks/static-components -- Icon is a stable
          reference resolved from a static icon-name map, not created per render. */}
      <Icon size={Math.round(size * 0.46)} strokeWidth={1.75} color={locked ? '#8a8478' : iconColor} />
      {locked && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-secondary text-white ring-2 ring-white">
          <Lock size={11} strokeWidth={2} />
        </span>
      )}
      {!locked && count > 1 && (
        <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white ring-2 ring-white">
          ×{count}
        </span>
      )}
    </span>
  );
}
