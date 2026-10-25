# overnight_runner.ps1 - Autonomous Overnight Watchdog & Runner
param (
    [int]$WaitSeconds = 18000 # 5 hours
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [Abyss Roll] Autonomous Night Watchdog & Pipeline Runner" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Ensure FreeLLMAPI is online
$portListening = netstat -ano | Select-String ":3001.*LISTENING"
if (-not $portListening) {
    Write-Host "[Runner] Starting FreeLLMAPI background daemon..." -ForegroundColor Green
    Start-Process -FilePath "node" -ArgumentList "freellmapi/server/dist/index.js" -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "[Runner] FreeLLMAPI is active on port 3001." -ForegroundColor Green
}

# 2. Check if batch data generator needs running
$streamingAssetsDir = "KoreaZombieSurvival/Assets/StreamingAssets"
if (-not (Test-Path $streamingAssetsDir)) {
    New-Item -ItemType Directory -Path $streamingAssetsDir -Force | Out-Null
}

Write-Host "[Runner] Checking data assets..." -ForegroundColor Cyan
node KoreaZombieSurvival/GenerateDarkData.js

# 3. Git commit progress snapshot
git add .
git commit -m "Auto-progress update: overnight runner checkpoint" --allow-empty
Write-Host "[Runner] Progress safely saved to git." -ForegroundColor Green

Write-Host "[Runner] In case of token limit or waiting interval, watchdog timer set to $WaitSeconds seconds (5 hours)." -ForegroundColor Yellow
