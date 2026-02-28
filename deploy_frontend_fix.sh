#!/bin/bash

# Script to deploy frontend Header fix to live server

echo "=== Deploying Frontend Header Fix ==="

# Copy the fixed Header component to live server
scp frontend/src/components/Header.tsx root@srv1336536.hstgr.cloud:/root/Radhvi/Gifts/frontend_live/src/components/

# SSH into server and rebuild
ssh root@srv1336536.hstgr.cloud << 'EOF'
cd /root/Radhvi/Gifts/frontend_live

# Rebuild Next.js
echo "Rebuilding Next.js..."
npm run build

# Restart PM2
echo "Restarting Next.js with PM2..."
pm2 restart nextjs-app

echo "=== Deployment complete! ==="
EOF

echo "Frontend fix deployed successfully!"
