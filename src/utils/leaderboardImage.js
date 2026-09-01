import logo from '../assets/logo.png';

const WIDTH = 1200;
const HEIGHT = 1300;

const MEDAL = {
  0: { color: '#f5c518' },
  1: { color: '#c0c0c0' },
  2: { color: '#cd7f32' },
};

function loadImage(src, crossOrigin) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function firstName(name) {
  return (name || '').trim().split(/\s+/)[0] || '';
}

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawAvatar(ctx, img, member, cx, cy, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img) {
    const scale = Math.max((radius * 2) / img.width, (radius * 2) / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  } else {
    ctx.fillStyle = '#fff2cc';
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = '#6c450e';
    ctx.font = `700 ${Math.round(radius * 0.7)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials(member.nombre), cx, cy + radius * 0.05);
  }
  ctx.restore();
}

// Draws a branded podium graphic for the top 3 members and triggers a PNG
// download. Pure Canvas 2D — no export library needed for a single
// purpose-built graphic like this.
export async function downloadLeaderboardPng(top3) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, '#fff9e6');
  bg.addColorStop(1, '#ffffff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const [logoImg, avatar0, avatar1, avatar2] = await Promise.all([
    loadImage(logo),
    loadImage(top3[0]?.foto_url, 'anonymous'),
    loadImage(top3[1]?.foto_url, 'anonymous'),
    loadImage(top3[2]?.foto_url, 'anonymous'),
  ]);
  const avatars = [avatar0, avatar1, avatar2];

  if (logoImg) {
    const logoSize = 96;
    const cx = WIDTH / 2;
    const cy = 130;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, logoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const scale = Math.max(logoSize / logoImg.width, logoSize / logoImg.height);
    const w = logoImg.width * scale;
    const h = logoImg.height * scale;
    ctx.drawImage(logoImg, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  }

  ctx.fillStyle = '#1c1a16';
  ctx.textAlign = 'center';
  ctx.font = '700 56px system-ui, sans-serif';
  ctx.fillText("Today's Leaderboard", WIDTH / 2, 250);

  ctx.fillStyle = '#7a7364';
  ctx.font = '500 26px system-ui, sans-serif';
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.fillText(dateLabel, WIDTH / 2, 292);

  // Podium: 2nd on the left, 1st in the center (tallest), 3rd on the right.
  const order = [1, 0, 2];
  const slotWidth = WIDTH / 3;
  const baseY = 880;
  const radii = { 0: 140, 1: 105, 2: 95 };
  const podiumHeights = { 0: 260, 1: 180, 2: 140 };

  order.forEach((rankIdx, slot) => {
    const member = top3[rankIdx];
    if (!member) return;
    const cx = slotWidth * slot + slotWidth / 2;
    const radius = radii[rankIdx];
    const cy = baseY - podiumHeights[rankIdx];

    const blockTop = cy + radius + 20;
    const blockHeight = podiumHeights[rankIdx] + 60;
    ctx.fillStyle = MEDAL[rankIdx].color;
    roundRect(ctx, cx - slotWidth * 0.34, blockTop, slotWidth * 0.68, blockHeight, 24);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.font = '800 64px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(rankIdx + 1), cx, blockTop + 90);

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = MEDAL[rankIdx].color;
    ctx.lineWidth = 6;
    ctx.stroke();

    drawAvatar(ctx, avatars[rankIdx], member, cx, cy, radius);

    ctx.fillStyle = '#1c1a16';
    ctx.font = '700 34px system-ui, sans-serif';
    ctx.fillText(firstName(member.nombre), cx, blockTop + blockHeight - 60, slotWidth * 0.9);

    ctx.fillStyle = '#3d3324';
    ctx.font = '600 28px system-ui, sans-serif';
    ctx.fillText(`${member.puntaje ?? 0} pts`, cx, blockTop + blockHeight - 22);
  });

  ctx.fillStyle = '#a79f8c';
  ctx.font = '500 22px system-ui, sans-serif';
  ctx.fillText('VespoUAV', WIDTH / 2, HEIGHT - 50);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateSlug = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `leaderboard-${dateSlug}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
