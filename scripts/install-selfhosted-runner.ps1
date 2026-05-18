# Install GitHub Actions self-hosted runner on THIS Windows PC (autonomous ads watch).
#
#   .\scripts\install-selfhosted-runner.ps1
#
# Then once: cd etsy-offsite-ads && npm run login
# Use workflow: "Etsy Ads Watch (Autonomous)" → Run workflow

$ErrorActionPreference = "Stop"
$Owner = "wtmjames1229-lab"
$Repo = "poster-automation"
$RunnerName = "ads-watch-pc"
$Labels = "ads-watch,Windows,self-hosted"

$gh = "${env:ProgramFiles}\GitHub CLI\gh.exe"
if (-not (Test-Path $gh)) { $gh = "gh" }

Write-Host ""
Write-Host "=== Self-hosted runner (autonomous ads watch) ===" -ForegroundColor Cyan
Write-Host ""

& $gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Run first: gh auth login" -ForegroundColor Yellow
  exit 1
}

$runnerDir = Join-Path $env:USERPROFILE "actions-runner-ads-watch"
New-Item -ItemType Directory -Path $runnerDir -Force | Out-Null
Set-Location $runnerDir

if (-not (Test-Path "config.cmd")) {
  Write-Host "Downloading latest actions/runner for Windows x64..." -ForegroundColor Cyan
  $zip = Join-Path $runnerDir "runner.zip"
  $release = & $gh release view -R actions/runner --json tagName -q .tagName
  if (-not $release) { $release = "v2.321.0" }
  $ver = $release.TrimStart("v")
  $url = "https://github.com/actions/runner/releases/download/v$ver/actions-runner-win-x64-$ver.zip"
  Invoke-WebRequest -Uri $url -OutFile $zip
  Expand-Archive -Path $zip -DestinationPath $runnerDir -Force
  Remove-Item $zip -Force
}

Write-Host "Registering runner..." -ForegroundColor Cyan
$token = (& $gh api -X POST "repos/$Owner/$Repo/actions/runners/registration-token" --jq .token).Trim()
.\config.cmd --url "https://github.com/$Owner/$Repo" --token $token --name $RunnerName --labels $Labels --unattended --replace

Write-Host "Installing Windows service..." -ForegroundColor Cyan
.\svc.cmd install
.\svc.cmd start

Write-Host ""
Write-Host "Done. Runner: $runnerDir" -ForegroundColor Green
Write-Host ""
Write-Host "Next (one time only):" -ForegroundColor Yellow
Write-Host "  cd etsy-offsite-ads"
Write-Host "  npm install"
Write-Host "  npx playwright install chromium"
Write-Host "  npm run login"
Write-Host ""
Write-Host "Then GitHub → Actions → 'Etsy Ads Watch (Autonomous)' → Run workflow" -ForegroundColor Green
Write-Host "No session:prepare needed after login — Chrome profile persists on this PC." -ForegroundColor Gray
