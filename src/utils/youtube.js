const ID_PATTERN = /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function parseYoutubeId(url) {
  if (!url) return null;
  const match = url.match(ID_PATTERN);
  return match ? match[1] : null;
}
