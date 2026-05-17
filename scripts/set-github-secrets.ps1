# Set GitHub Actions secrets from etsy-offsite-ads/.env (never prints secret values).
# Usage: .\scripts\set-github-secrets.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root "etsy-offsite-ads\.env"
$sessionFile = Join-Path $root "etsy-offsite-ads\printify_session.json"
$repo = "wtmjames1229-lab/poster-automation"
$gh = "${env:ProgramFiles}\GitHub CLI\gh.exe"
if (-not (Test-Path $gh)) { $gh = "gh" }

if (-not (Test-Path $envFile)) { throw "Missing $envFile" }
if (-not (Test-Path $sessionFile)) {
  throw "Missing $sessionFile. Run: cd etsy-offsite-ads; npm run login; npm run session:export"
}

$vars = @{}
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $i = $line.IndexOf("=")
  if ($i -lt 1) { return }
  $vars[$line.Substring(0, $i).Trim()] = $line.Substring($i + 1).Trim()
}

$map = @{
  PRINTIFY_API_KEY  = $vars["PRINTIFY_API_KEY"]
  PRINTIFY_EMAIL    = $vars["PRINTIFY_EMAIL"]
  PRINTIFY_PASSWORD = $vars["PRINTIFY_PASSWORD"]
  PRINTIFY_SHOP_ID  = $vars["PRINTIFY_SHOP_ID"]
  MAIL_TO           = if ($vars["MAIL_TO"]) { $vars["MAIL_TO"] } else { $vars["PRINTIFY_EMAIL"] }
}

$tmpDir = Join-Path $env:TEMP ("gh-secrets-" + [Guid]::NewGuid().ToString("n"))
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

foreach ($key in $map.Keys) {
  $val = $map[$key]
  if (-not $val) {
    Write-Warning "Skipping empty: $key"
    continue
  }
  $tmpFile = Join-Path $tmpDir $key
  [IO.File]::WriteAllText($tmpFile, $val, [Text.UTF8Encoding]::new($false))
  Write-Host "Setting secret: $key"
  Get-Content -Path $tmpFile -Raw -Encoding UTF8 | & $gh secret set $key --repo $repo
  if ($LASTEXITCODE -ne 0) { throw "Failed to set $key" }
}

Write-Host "Setting secret: PRINTIFY_SESSION_JSON (minified session file)"
node (Join-Path $root "etsy-offsite-ads\scripts\sessionToGithub.js")
if ($LASTEXITCODE -ne 0) { throw "Failed to set PRINTIFY_SESSION_JSON" }

Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue
Write-Host "All secrets set for $repo" -ForegroundColor Green
