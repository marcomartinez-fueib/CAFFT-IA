/**
 * Resolves video asset URLs based on the deployment environment.
 *
 * DEVELOPMENT (Google AI Studio / local Vite dev server):
 *   Videos are served from public/videos_cafft/ via the Vite dev server.
 *   Relative paths like `videos_cafft/ev001_ca.mp4` resolve correctly.
 *
 * PRODUCTION (Vercel):
 *   Videos are hosted as flat release assets on GitHub Releases.
 *   The filename is extracted from the relative path and appended to VITE_VIDEO_BASE_URL.
 *   Set VITE_VIDEO_BASE_URL in Vercel environment variables:
 *   VITE_VIDEO_BASE_URL=https://github.com/marcomartinez-fueib/CAFFT-IA/releases/download/v1.0.0-videos
 *
 *   Example: "videos_cafft/ev001_ca.mp4" → "https://.../v1.0.0-videos/ev001_ca.mp4"
 *
 * @param relativePath - Path relative to the video root (e.g. "videos_cafft/ev001_ca.mp4")
 * @returns The full URL to use as the video source
 */
export function resolveVideoUrl(relativePath: string): string {
  const base = import.meta.env.VITE_VIDEO_BASE_URL || '';

  if (base) {
    // GitHub Release assets are flat — extract just the filename, no directory prefix
    const fileName = relativePath.split('/').pop() || relativePath;
    const cleanBase = base.replace(/\/+$/, '');
    return `${cleanBase}/${fileName}`;
  }

  return relativePath;
}
