# Set GitHub Actions secrets from etsy-offsite-ads/.env (never prints secret values).
# Usage: .\scripts\set-github-secrets.ps1
# Optional: put session base64 in .session-b64.tmp (one line, gitignored)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root "etsy-offsite-ads\.env"
$repo = "wtmjames1229-lab/poster-automation"
$gh = "${env:ProgramFiles}\GitHub CLI\gh.exe"
if (-not (Test-Path $gh)) { $gh = "gh" }

if (-not (Test-Path $envFile)) { throw "Missing $envFile" }

$vars = @{}
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $i = $line.IndexOf("=")
  if ($i -lt 1) { return }
  $vars[$line.Substring(0, $i).Trim()] = $line.Substring($i + 1).Trim()
}

$sessionB64Path = Join-Path $root ".session-b64.tmp"
$sessionFile = Join-Path $root "etsy-offsite-ads\printify_session.json"
if (Test-Path $sessionB64Path) {
  $sessionB64 = (Get-Content $sessionB64Path -Raw).Trim()
} elseif (Test-Path $sessionFile) {
  $bytes = [IO.File]::ReadAllBytes($sessionFile)
  $sessionB64 = [Convert]::ToBase64String($bytes)
} else {
  throw "No session: add .session-b64.tmp or run npm run session:export in etsy-offsite-ads"
}

$map = @{
  PRINTIFY_API_KEY       = $vars["PRINTIFY_API_KEY"]
  PRINTIFY_EMAIL         = $vars["PRINTIFY_EMAIL"]
  PRINTIFY_PASSWORD      = $vars["PRINTIFY_PASSWORD"]
  PRINTIFY_SHOP_ID       = $vars["PRINTIFY_SHOP_ID"]
  PRINTIFY_SESSION_B64   = $sessionB64
  MAIL_TO                = if ($vars["MAIL_TO"]) { $vars["MAIL_TO"] } else { $vars["PRINTIFY_EMAIL"] }
}

foreach ($key in $map.Keys) {
  $val = $map[$key]
  if (-not $val) {
    Write-Warning "Skipping empty: $key"
    continue
  }
  Write-Host "Setting secret: $key"
  $val | & $gh secret set $key --repo $repo --body -
  if ($LASTEXITCODE -ne 0) { throw "Failed to set $key" }
}

Write-Host "All secrets set for $repo" -ForegroundColor Green
