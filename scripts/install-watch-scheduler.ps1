# Windows Task Scheduler — fully local autonomous watch (no GitHub Actions).
# Login once with npm run login; task runs watch every 6 hours while PC is on.
#
#   .\scripts\install-watch-scheduler.ps1
#   .\scripts\install-watch-scheduler.ps1 -Remove

param([switch]$Remove)

$ErrorActionPreference = "Stop"
$TaskName = "EtsyAdsWatch"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$etsy = Join-Path $root "etsy-offsite-ads"
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $npm) { $npm = (Get-Command npm -ErrorAction SilentlyContinue).Source }
if (-not $npm) { throw "npm not found on PATH" }

$logDir = Join-Path $etsy "data\scheduler-logs"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$runner = Join-Path $env:TEMP "etsy-ads-watch-task.cmd"
@"
@echo off
cd /d "$etsy"
set PLAYWRIGHT_USE_PROFILE=true
set PLAYWRIGHT_PREFER_SESSION=false
set PLAYWRIGHT_HEADLESS=true
set PRINTIFY_NAV_VIA_PRODUCTS=true
set ADS_WATCH_AUTO_RELOGIN=true
call "$npm" run watch >> "$logDir\watch.log" 2>&1
"@ | Set-Content -Path $runner -Encoding ASCII

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Removed scheduled task: $TaskName" -ForegroundColor Green
  exit 0
}

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$runner`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration ([TimeSpan]::MaxValue)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

Write-Host ""
Write-Host "Scheduled task installed: $TaskName (every 6 hours)" -ForegroundColor Green
Write-Host "Logs: $logDir\watch.log"
Write-Host ""
Write-Host "One-time: cd etsy-offsite-ads && npm run login" -ForegroundColor Yellow
Write-Host "PC must be on at run times. No GitHub session upload needed." -ForegroundColor Gray
