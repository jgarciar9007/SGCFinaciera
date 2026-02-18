# Deploy Script for SGCFinanciera to 192.168.20.8
$ErrorActionPreference = "Stop"

$HOST_IP = "192.168.20.8"
$USER = "root"
$REMOTE_DIR = "/opt/sgcf"

Write-Host "🚀 Iniciando despliegue a $HOST_IP..." -ForegroundColor Cyan

# 1. Check/Install Docker AND Create Directory (Combined to save 1 auth)
Write-Host "🏗️ Preparando servidor (Docker + Directorios)..."
$installCmd = 'if ! command -v docker >/dev/null; then echo "Instalando Docker..."; apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-v2 curl; fi'
$swapCmd = 'if [ ! -f /swapfile ]; then echo "Creando Swap..."; fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile || true; fi'
$mkdirCmd = "mkdir -p $REMOTE_DIR"
# Combine commands. Use single quotes for complex logic where possible, but we need $REMOTE_DIR.
# We will send a script snippet.
ssh "$USER@$HOST_IP" "$installCmd; $swapCmd; $mkdirCmd"

# 2. Upload Bundle
Write-Host "uploading files..."
# Create a temporary tar of the project, excluding heavy folders BUT INCLUDING DIST
tar --exclude='node_modules' --exclude='.git' -czf project.tar.gz .
scp project.tar.gz "$USER@${HOST_IP}:${REMOTE_DIR}/"
Remove-Item project.tar.gz

# 3. Extract and Run (Combined)
Write-Host "🚀 Desplegando Contenedores..."
# We explicitly add /usr/bin and /usr/local/bin to PATH just in case, and try sourcing profile
$runCmd = "cd $REMOTE_DIR; tar -xzf project.tar.gz; rm project.tar.gz; export PATH=`$PATH:/usr/bin:/usr/local/bin; docker compose up --build -d"
ssh "$USER@$HOST_IP" $runCmd

Write-Host "✨ Despliegue COMPLETADO!" -ForegroundColor Green
Write-Host "🌐 Accede a: http://$HOST_IP" -ForegroundColor Cyan
