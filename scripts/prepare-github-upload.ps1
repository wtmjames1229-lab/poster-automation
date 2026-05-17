# Prepare folder for GitHub upload (does not push).
# Run from project root:  .\scripts\prepare-github-upload.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "=== Prepare for GitHub upload ===" -ForegroundColor Cyan

# Ensure lockfile for Actions npm ci
Push-Location etsy-offsite-ads
if (-not (Test-Path package-lock.json)) {
  Write-Host "Generating package-lock.json..."
  npm install --package-lock-only
}
Pop-Location

# Warn if secrets would be committed
$danger = @(
  ".env",
  "etsy-offsite-ads\.env",
  "printify_session.json",
  "etsy-offsite-ads\printify_session.json"
)
foreach ($f in $danger) {
  if (Test-Path $f) {
    Write-Host "OK: $f exists locally (must stay out of git)" -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  1. git init  (if new repo)"
Write-Host "  2. git add ."
Write-Host "  3. git status   <- confirm NO .env or session files"
Write-Host "  4. git commit -m 'Initial commit'"
Write-Host "  5. Push to GitHub"
Write-Host "  6. Follow GITHUB_SETUP.md for secrets and first workflow run"
Write-Host ""
