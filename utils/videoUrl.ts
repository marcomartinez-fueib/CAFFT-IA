/**
 * Resolves video asset URLs.
 *
 * Videos are served from the same origin as the app, under
 * `<base>/videos_cafft/`. On the on-premise deployment that is
 * `https://pausat.uib.es/cafft/videos_cafft/...`; in dev it is served from
 * `public/videos_cafft/` by the Vite dev server.
 *
 * Keeping them same-origin is required by the deployment's
 * Content-Security-Policy (`default-src 'self'`, which `media-src` falls back
 * to) and keeps the clinical video content in-house.
 *
 * `VITE_VIDEO_BASE_URL` can still point the app at an external origin (for
 * example a CDN). Leave it unset for the on-premise deployment — an external
 * origin will be blocked by CSP unless `media-src` is widened to match.
 *
 * @param relativePath - Path relative to the video root (e.g. "videos_cafft/ev001_ca.mp4")
 * @returns The full URL to use as the video source
 */
export function resolveVideoUrl(relativePath: string): string {
  const externalBase = import.meta.env.VITE_VIDEO_BASE_URL || '';

  if (externalBase) {
    // Flat external stores (e.g. GitHub Release assets) have no directory
    // structure — use just the filename.
    const fileName = relativePath.split('/').pop() || relativePath;
    return `${externalBase.replace(/\/+$/, '')}/${fileName}`;
  }

  // Prefix the app's base path so the URL resolves the same regardless of which
  // route the user is on. import.meta.env.BASE_URL always ends with "/".
  return `${import.meta.env.BASE_URL}${relativePath.replace(/^\/+/, '')}`;
}
