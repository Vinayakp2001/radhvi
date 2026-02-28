#!/bin/bash

# Script to sync API files to live server and restart services

echo "=== Syncing API files to live server ==="

# Navigate to live project
cd /root/Radhvi/Gifts/gift_project_live

# Check if API directory exists
if [ ! -d "gift/api" ]; then
    echo "Creating gift/api directory..."
    mkdir -p gift/api
fi

# Copy API files from local project
echo "Copying API files..."
cp -r /root/Radhvi/Gifts/radhvi_new/gift_project/gift/api/* gift/api/

# Copy main URLs file
echo "Copying main URLs configuration..."
cp /root/Radhvi/Gifts/radhvi_new/gift_project/gift_project/urls.py gift_project/urls.py

# Activate virtual environment
source /root/Radhvi/venv/bin/activate

# Install required packages
echo "Installing rest_framework if needed..."
pip install djangorestframework django-cors-headers pillow

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Restart Gunicorn
echo "Restarting Gunicorn..."
sudo systemctl restart gunicorn

echo "=== Sync complete! ==="
echo "Testing API..."
sleep 2
curl -s https://radhvi.in/api/products/ | head -20
