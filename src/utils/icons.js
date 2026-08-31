import { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Award } from 'lucide-react';
import { TABLER_NAMES } from './tablerIconNames';

export const LUCIDE_NAMES = Object.keys(LucideIcons)
  .filter((key) => /^[A-Z][A-Za-z0-9]*$/.test(key) && !key.endsWith('Icon'))
  .sort();

export { TABLER_NAMES };

// The Tabler icon set is large, so its component code is only fetched on demand
// (when an achievement actually references a "tabler:" icon, or the picker opens)
// instead of bloating the initial app bundle for every visitor.
let tablerCache = null;
let tablerPromise = null;

function ensureTablerLoaded() {
  if (!tablerPromise) {
    tablerPromise = import('@tabler/icons-react').then((mod) => {
      tablerCache = mod;
      return mod;
    });
  }
  return tablerPromise;
}

// Call from a component that may render a tabler icon; triggers the lazy load
// (if `needed`) and re-renders once it resolves so resolveIcon() picks it up.
export function useTablerReady(needed = true) {
  const [, forceRender] = useState(0);
  useEffect(() => {
    if (!needed || tablerCache) return;
    let alive = true;
    ensureTablerLoaded().then(() => {
      if (alive) forceRender((t) => t + 1);
    });
    return () => {
      alive = false;
    };
  }, [needed]);
}

// Icons are stored as "lucide:Name" or "tabler:IconName". A bare, unprefixed
// value is treated as a legacy lucide icon name for backward compatibility.
export function resolveIcon(value) {
  if (!value) return Award;
  const [lib, name] = value.includes(':') ? value.split(':') : ['lucide', value];
  if (lib === 'tabler') return (tablerCache && tablerCache[name]) || Award;
  return LucideIcons[name] || Award;
}

export function iconLibraryOf(value) {
  return value && value.includes(':') ? value.split(':')[0] : 'lucide';
}
