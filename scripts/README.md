# CAFFT-IA Video Upload Scripts

This directory contains scripts to upload CAFFT exposure videos to GitHub Releases.

## Prerequisites

1. A GitHub Personal Access Token with `repo` scope
   - Create one at: https://github.com/settings/tokens
   - Select "repo" scope for full control of private repositories

2. Videos must be in `public/videos_cafft/` directory with the following naming convention:
   - `ev001_ca.mp4`, `ev001_es.mp4`, `ev001_en.mp4`
   - `ev002_ca.mp4`, `ev002_es.mp4`, `ev002_en.mp4`
   - ... (ev003-ev006)
   - `exposure_explanation_ca.mp4`, `exposure_explanation_es.mp4`, `exposure_explanation_en.mp4`

## Usage

### Windows (PowerShell)

```powershell
.\scripts\upload-videos-to-release.ps1 -GitHubToken "your_token_here"
```

Optional parameters:
- `-Owner "your-username"` (default: marcomartinez-fueib)
- `-Repo "your-repo"` (default: CAFFT-IA)
- `-TagName "v1.0.0-videos"` (default: v1.0.0-videos)

### Linux/Mac (Bash)

```bash
chmod +x scripts/upload-videos-to-release.sh
./scripts/upload-videos-to-release.sh your_token_here marcomartinez-fueib CAFFT-IA v1.0.0-videos
```

## Environment Variables

After uploading, update your `.env` file with the release URL:

```env
VIDEOS_BASE_URL=https://github.com/marcomartinez-fueib/CAFFT-IA/releases/download/v1.0.0-videos/
```

## Video URLs Format

The videos will be accessible at:
```
https://github.com/{owner}/{repo}/releases/download/{tag}/{video_id}_{language}.mp4
```

Example:
```
https://github.com/marcomartinez-fueib/CAFFT-IA/releases/download/v1.0.0-videos/ev001_ca.mp4
```

## Notes

- GitHub Releases have a 2GB limit per asset
- Total repository size limit is 100GB (recommended to keep under 1GB)
- Videos are served from GitHub's CDN for fast delivery
- The application will automatically fall back to CDN videos if GitHub Release videos fail to load
