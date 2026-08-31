const ID_PATTERNS = [/\/d\/([a-zA-Z0-9_-]{10,})/, /[?&]id=([a-zA-Z0-9_-]{10,})/];

export function parseDriveUrl(url) {
  if (!url) return null;
  for (const pattern of ID_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return { fileId: match[1], previewUrl: `https://drive.google.com/file/d/${match[1]}/preview` };
    }
  }
  return null;
}
