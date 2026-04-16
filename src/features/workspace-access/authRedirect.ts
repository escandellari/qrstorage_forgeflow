export function buildAuthCallbackUrl(nextPath?: string) {
  const redirectUrl = new URL('/auth/callback', window.location.origin);

  if (nextPath && nextPath.startsWith('/')) {
    redirectUrl.searchParams.set('next', nextPath);
  }

  return redirectUrl.toString();
}

export function readSafeNextPath(search: string) {
  const nextPath = new URLSearchParams(search).get('next');

  if (!nextPath || !nextPath.startsWith('/')) {
    return null;
  }

  return nextPath;
}
