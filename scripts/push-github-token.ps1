# Push to GitHub using a Personal Access Token (not stored in git).
#
# Usage (pick one):
#   $env:GITHUB_TOKEN = "ghp_xxxx"; .\scripts\push-github-token.ps1
#   .\scripts\push-github-token.ps1 -Token "ghp_xxxx"
#   Put token in .github-token (one line, gitignored) then: .\scripts\push-github-token.ps1
#
# Token needs: repo scope (classic) or Contents + Actions (fine-grained).

param(
  [string]$Token,
  [string]$Owner = "wtmjames1229-lab",
  [string]$Repo = "poster-automation",
  [switch]$Public
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not $Token) { $Token = $env:GITHUB_TOKEN }
if (-not $Token) { $Token = $env:GH_TOKEN }
if (-not $Token -and (Test-Path ".github-token")) {
  $Token = (Get-Content ".github-token" -Raw).Trim()
}

if (-not $Token) {
  Write-Host "Paste GitHub Personal Access Token (input hidden):" -ForegroundColor Cyan
  $secure = Read-Host -AsSecureString
  $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

if (-not $Token) { throw "No token provided." }

$gh = "${env:ProgramFiles}\GitHub CLI\gh.exe"
if (-not (Test-Path $gh)) { $gh = "gh" }

$env:GH_TOKEN = $Token
$env:GITHUB_TOKEN = $Token

# gh uses GH_TOKEN automatically; only run login when not using env token flow
if (-not $env:GH_TOKEN) {
  Write-Host "Authenticating with GitHub CLI..." -ForegroundColor Cyan
  $Token | & $gh auth login --with-token
  if ($LASTEXITCODE -ne 0) { throw "gh auth login failed" }
} else {
  Write-Host "Using token from environment for GitHub API..." -ForegroundColor Cyan
}

# Ensure remote
git remote remove origin 2>$null
git remote add origin "https://github.com/${Owner}/${Repo}.git"

# Create repo if missing, then push
& $gh repo view "${Owner}/${Repo}" 2>$null | Out-Null
$repoExists = ($LASTEXITCODE -eq 0)

if (-not $repoExists) {
  Write-Host "Creating repository ${Owner}/${Repo}..." -ForegroundColor Cyan
  if ($Public) {
    & $gh repo create $Repo --public --source=. --remote=origin
  } else {
    & $gh repo create $Repo --private --source=. --remote=origin
  }
  if ($LASTEXITCODE -ne 0) { throw "gh repo create failed" }
}

Write-Host "Pushing main branch..." -ForegroundColor Cyan
git branch -M main 2>$null
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "git push failed" }

Write-Host ""
Write-Host "Done: https://github.com/${Owner}/${Repo}" -ForegroundColor Green
Write-Host "Next: add secrets in GitHub repo Settings (see GITHUB_SETUP.md)" -ForegroundColor Yellow
