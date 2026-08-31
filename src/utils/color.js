function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex({ r, g, b }) {
  const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function relativeLuminance({ r, g, b }) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Returns a lighter (on dark backgrounds) or darker (on light backgrounds) tint
// of the same hue, so an icon always contrasts with and matches its badge color.
export function shadeColor(hex) {
  if (!hex) return '#ffffff';
  let rgb;
  try {
    rgb = hexToRgb(hex);
  } catch {
    return '#ffffff';
  }

  const isDark = relativeLuminance(rgb) < 0.5;
  const mix = isDark
    ? { r: 255, g: 255, b: 255 } // lighten toward white
    : { r: 0, g: 0, b: 0 }; // darken toward black
  const amount = 0.62;

  return rgbToHex({
    r: rgb.r + (mix.r - rgb.r) * amount,
    g: rgb.g + (mix.g - rgb.g) * amount,
    b: rgb.b + (mix.b - rgb.b) * amount,
  });
}
