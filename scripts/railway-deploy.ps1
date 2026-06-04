# Movee — deploy to Railway (run after: railway login)
$ErrorActionPreference = "Stop"
$env:PATH = "$env:LOCALAPPDATA\node-portable;$env:APPDATA\npm;$env:PATH"

Set-Location $PSScriptRoot\..

Write-Host "=== Movee Railway deploy ===" -ForegroundColor Cyan

if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
  npm install -g @railway/cli
}

$who = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Not logged in. Run: railway login" -ForegroundColor Yellow
  railway login
}

if (-not (Test-Path ".railway")) {
  Write-Host "Linking project (creates or connects a Railway project)..." -ForegroundColor Cyan
  railway init --name movee
}

Write-Host "Adding PostgreSQL (skip if already added in this project)..." -ForegroundColor Cyan
railway add --database postgres 2>$null

$jwt = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
Write-Host "Setting environment variables..." -ForegroundColor Cyan
railway variables --set "JWT_SECRET=$jwt"
railway variables --set "NODE_ENV=production"
railway variables --set "NEXT_PUBLIC_APP_NAME=Movee"
railway variables --set 'NEXT_PUBLIC_APP_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}'
railway variables --set "NEXT_PUBLIC_BASE_FARE=2.50"
railway variables --set "NEXT_PUBLIC_PER_KM_RATE=1.20"
railway variables --set "NEXT_PUBLIC_PER_MIN_RATE=0.25"
railway variables --set "PLATFORM_COMMISSION_RATE=0.15"
railway variables --set "NEXT_PUBLIC_COMMISSION_RATE=0.15"

Write-Host "In Railway dashboard: link DATABASE_URL on this service to your PostgreSQL plugin variable (if not auto-linked)." -ForegroundColor Yellow

Write-Host "Deploying..." -ForegroundColor Cyan
railway up --detach

Write-Host ""
Write-Host "After deploy finishes, seed demo users once:" -ForegroundColor Green
Write-Host "  railway run npm run db:seed"
Write-Host ""
Write-Host "Open the app:" -ForegroundColor Green
Write-Host "  railway open"
