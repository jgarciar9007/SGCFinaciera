# PM2 Deployment Script for SGCFinanciera to 192.168.20.8
$ErrorActionPreference = "Stop"
$HOST_IP = "192.168.20.8"
$USER = "root"

$rootDir = Get-Location
Write-Host "STARTING deployment to $HOST_IP..." -ForegroundColor Cyan

# 1. Prepare Artifacts Locally
Write-Host "Creating archives..."

# Cleanup old
Remove-Item "server_pkg.zip", "client_pkg.zip", "deploy_bundle.zip" -ErrorAction SilentlyContinue

# Server
Write-Host "   - Archiving Server..."
cd server
tar.exe -a -c -f ../server_pkg.zip package.json package-lock.json prisma .env dist
cd ..

# Client
Write-Host "   - Archiving Client..."
cd client
tar.exe -a -c -f ../client_pkg.zip dist
cd ..

# Bundle Everything
Write-Host "   - Creating Upload Bundle..."
tar.exe -a -c -f deploy_bundle.zip server_pkg.zip client_pkg.zip nginx_host.conf setup_remote.sh

# 2. Upload Everything
Write-Host "Uploading bundle..."
scp deploy_bundle.zip "$USER@${HOST_IP}:/tmp/"

# Cleanup Local
Remove-Item server_pkg.zip, client_pkg.zip, deploy_bundle.zip

# 3. Execute Remote Script
Write-Host "Executing remote script..."
# unzip bundle, then run setup
ssh "$USER@$HOST_IP" "apt-get update; apt-get install -y unzip dos2unix; unzip -o /tmp/deploy_bundle.zip -d /tmp/; dos2unix /tmp/setup_remote.sh; chmod +x /tmp/setup_remote.sh; /tmp/setup_remote.sh"

Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "Access at: http://$HOST_IP" -ForegroundColor Cyan
