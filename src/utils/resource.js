export function fileExtension(url) {
  if (!url) return null;
  try {
    const path = new URL(url).pathname;
    const match = path.match(/\.([a-zA-Z0-9]{1,6})$/);
    return match ? `.${match[1].toLowerCase()}` : null;
  } catch {
    return null;
  }
}
