# PowerShell script to upload videos to GitHub Release using GitHub CLI
# Usage: .\scripts\upload-videos-with-gh.ps1
# Requires: gh CLI authenticated (gh auth login)

$ErrorActionPreference = "Stop"

$TagName = "v1.0.0-videos"
$ReleaseName = "CAFFT Videos v1.0.0"
$VideoDir = "public\videos_cafft"

$Videos = @(
    "ev001_ca.mp4", "ev001_es.mp4", "ev001_en.mp4",
    "ev002_ca.mp4", "ev002_es.mp4", "ev002_en.mp4",
    "ev003_ca.mp4", "ev003_es.mp4", "ev003_en.mp4",
    "ev004_ca.mp4", "ev004_es.mp4", "ev004_en.mp4",
    "ev005_ca.mp4", "ev005_es.mp4", "ev005_en.mp4",
    "ev006_ca.mp4", "ev006_es.mp4", "ev006_en.mp4",
    "exposure_explanation_ca.mp4", "exposure_explanation_es.mp4", "exposure_explanation_en.mp4"
)

# Check if release already exists
$ExistingRelease = gh release view $TagName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Release $TagName already exists. Deleting first..." -ForegroundColor Yellow
    gh release delete $TagName --yes
    Write-Host "Release deleted." -ForegroundColor Green
}

# Collect video files that exist
$VideoFiles = @()
foreach ($Video in $Videos) {
    $FilePath = Join-Path $VideoDir $Video
    if (Test-Path $FilePath) {
        $VideoFiles += $FilePath
    } else {
        Write-Host "Warning: $FilePath not found, skipping..." -ForegroundColor Yellow
    }
}

if ($VideoFiles.Count -eq 0) {
    Write-Host "Error: No video files found!" -ForegroundColor Red
    exit 1
}

Write-Host "Creating release $TagName with $($VideoFiles.Count) videos..." -ForegroundColor Cyan

# Create release and upload all videos at once
gh release create $TagName --title $ReleaseName --notes "Exposure videos for CAFFT-IA application in Catalan, Spanish, and English." @VideoFiles

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Release created successfully!" -ForegroundColor Green
    Write-Host "Release URL: https://github.com/marcomartinez-fueib/CAFFT-IA/releases/tag/$TagName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Update your .env file with:" -ForegroundColor Yellow
    Write-Host "VIDEOS_BASE_URL=https://github.com/marcomartinez-fueib/CAFFT-IA/releases/download/$TagName/" -ForegroundColor White
} else {
    Write-Host "Error creating release" -ForegroundColor Red
    exit 1
}
