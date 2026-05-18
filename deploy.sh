#!/bin/bash
# Run on the Linode server: bash deploy.sh
set -e

APP_DIR="/var/www/boa-backend"

echo "==> Pulling latest code..."
cd "$APP_DIR"
git pull origin main

echo "==> Installing production dependencies..."
npm install --omit=dev

echo "==> Building TypeScript..."
npm run build

echo "==> Restarting with PM2..."
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "==> Done. App running on port 4000."
