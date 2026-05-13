/**
 * Resolves video asset URLs based on the deployment environment.
 *
 * DEVELOPMENT (Google AI Studio / local Vite dev server):
 *   Videos are served from public/videos_cafft/ via the Vite dev server.
 *   Relative paths like `videos_cafft/ev001_ca.mp4` resolve correctly.
 *
 * PRODUCTION (Vercel):
 *   Videos are hosted externally (GitHub Releases).
 *   Set VITE_VIDEO_BASE_URL in Vercel environment variables:
 *   VITE_VIDEO_BASE_URL=https://github.com/marcomartinez-fueib/CAFFT-IA/releases/download/v1.0.0-videos
 *
 * @param relativePath - Path relative to the video root (e.g. "videos_cafft/ev001_ca.mp4")
 * @returns The full URL to use as the video source
 */
export function resolveVideoUrl(relativePath: string): string {
  const base = import.meta.env.VITE_VIDEO_BASE_URL || '';

  if (base) {
    // Strip trailing slash from base and leading slash from path to avoid double-slashes
    const cleanBase = base.replace(/\/+$/, '');
    const cleanPath = relativePath.replace(/^\/+/, '');
    return `${cleanBase}/${cleanPath}`;
  }

  return relativePath;
}
