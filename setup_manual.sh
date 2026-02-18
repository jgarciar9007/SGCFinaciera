#!/bin/bash
set -ex

# 1. Install Global Tools
echo "Installing PM2 & Prisma..."
npm install -g pm2 prisma@latest

# 2. Extract Bundle (it is already in /tmp/deploy_bundle.zip, but let's re-extract to be sure)
echo "Extracting Bundle..."
unzip -o /tmp/deploy_bundle.zip -d /tmp/

# 3. Setup Client
echo "Setting up Client..."
rm -rf /var/www/html/*
# Unzip client pkg to temp dir
rm -rf /tmp/client_dist_temp
mkdir -p /tmp/client_dist_temp
unzip -o /tmp/client_pkg.zip -d /tmp/client_dist_temp
# Copy contents
if [ -d "/tmp/client_dist_temp/dist" ]; then
    cp -r /tmp/client_dist_temp/dist/* /var/www/html/
else
    cp -r /tmp/client_dist_temp/* /var/www/html/
fi
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# 4. Setup Server
echo "Setting up Server..."
rm -rf /opt/sgcf-api
mkdir -p /opt/sgcf-api
unzip -o /tmp/server_pkg.zip -d /opt/sgcf-api
cd /opt/sgcf-api
# Install deps
npm ci --omit=dev
npx prisma generate
# Stop old process
pm2 delete sgcf-api || true
# Start new
pm2 start dist/index.js --name "sgcf-api"
pm2 save
pm2 startup

# 5. Setup Nginx
echo "Setting up Nginx..."
cp /tmp/nginx_host.conf /etc/nginx/sites-available/default
# Ensure link exists
ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
systemctl restart nginx

echo "MANUAL SETUP COMPLETE"
