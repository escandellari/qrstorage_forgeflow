const BOX_PATH_PATTERN = /^\/boxes\/([^/]+)\/?$/;

export function getBoxIdFromScanValue(scanValue: string) {
  const trimmedValue = scanValue.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedValue, 'http://localhost');
    const match = parsedUrl.pathname.match(BOX_PATH_PATTERN);

    if (!match) {
      return null;
    }

    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
