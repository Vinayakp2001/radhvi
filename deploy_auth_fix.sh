#!/bin/bash

# Script to deploy authentication fixes to live server

echo "=== Deploying Authentication Fixes to Production ==="

# Define the server
SERVER="root@srv1336536.hstgr.cloud"
LIVE_PATH="/root/Radhvi/Gifts/gift_project_live/frontend"

# Copy the fixed components to live server
echo "Copying fixed components..."
scp frontend/src/components/Header.tsx $SERVER:$LIVE_PATH/src/components/
scp frontend/src/components/ProductActions.tsx $SERVER:$LIVE_PATH/src/components/
scp frontend/src/components/ProductGrid.tsx $SERVER:$LIVE_PATH/src/components/

# SSH into server and restart
ssh $SERVER << 'EOF'
cd /root/Radhvi/Gifts/gift_project_live/frontend

# Verify the fixes are applied
echo "=== Verifying fixes ==="
grep -n "useAuth" src/components/Header.tsx src/components/ProductActions.tsx src/components/ProductGrid.tsx

# Stop PM2
echo "Stopping PM2..."
pm2 stop radhvi-frontend

# Remove old build
echo "Removing old build..."
rm -rf .next

# Restart PM2 (it will run in dev mode without build)
echo "Starting PM2..."
pm2 start radhvi-frontend

# Wait for startup
sleep 3

# Check status
echo "=== PM2 Status ==="
pm2 status

echo "=== Deployment complete! ==="
EOF

echo "Authentication fixes deployed successfully!"
echo "Please clear your browser cache and refresh the page."
