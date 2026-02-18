#!/bin/bash
set -e
REMOTE_SERVER_DIR="/opt/sgcf-api"
REMOTE_CLIENT_DIR="/var/www/html"

echo "🔧 Configurando servidor..."

# Install deps
echo "📦 Instalando Node.js, Nginx, PM2, Unzip..."
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y curl nginx unzip
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2 prisma

# Setup Dirs
mkdir -p $REMOTE_SERVER_DIR
rm -rf $REMOTE_CLIENT_DIR/*

# Extract Client
echo "📂 Descomprimiendo Frontend..."
mkdir -p /tmp/client_dist
unzip -o /tmp/client_pkg.zip -d /tmp/client_dist
# If zip contains 'dist' folder
if [ -d "/tmp/client_dist/dist" ]; then
    cp -r /tmp/client_dist/dist/* $REMOTE_CLIENT_DIR/
else
    # Maybe contents are directly in root?
    cp -r /tmp/client_dist/* $REMOTE_CLIENT_DIR/
fi
rm -rf /tmp/client_dist

# Extract Server
echo "📂 Descomprimiendo Backend..."
unzip -o /tmp/server_pkg.zip -d $REMOTE_SERVER_DIR

# Setup Server
echo "🚀 Iniciando Backend..."
cd $REMOTE_SERVER_DIR
# If zip created nested folder?
# Compress-Archive of server/* puts files in root if Path is server/*?
# Or server/xxx?
# Windows Compress-Archive often keeps structure.
# I'll check structure. 
# Assuming structure is correct.
if [ ! -f "package.json" ]; then
    # Try finding subfolder?
    # Or just execute from where package.json is?
    # For now assume root.
    echo "Warning: package.json not found in root of $REMOTE_SERVER_DIR"
fi

npm ci --omit=dev
npx prisma generate
pm2 delete sgcf-api || true
pm2 start dist/index.js --name 'sgcf-api'
pm2 save
pm2 startup

# Nginx
echo "🌐 Configurando Nginx..."
mv /tmp/nginx_host.conf /etc/nginx/sites-available/default
systemctl restart nginx

echo "✅ Script remoto finalizado con ÉXITO."
