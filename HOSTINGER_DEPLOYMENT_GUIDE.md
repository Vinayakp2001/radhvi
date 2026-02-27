# Hostinger Deployment Guide - Replace Old with New Architecture

## Overview

This guide helps you replace your old Django architecture (port 8000) with the new Next.js + Django architecture on Hostinger.

---

## Current Setup (What's Running Now)

**Old Architecture (LIVE):**
- Django with templates (monolithic)
- Running on port 8000
- Served via radhvi.in
- Has issues you want to fix

**New Architecture (LOCAL):**
- Next.js frontend (port 3000)
- Django backend API (port 8000)
- Separate frontend/backend
- Incomplete but ready for showcase

---

## Pre-Deployment Checklist

### 1. Backup Current Live Site

**IMPORTANT:** Before making any changes, backup everything!

```bash
# SSH into your Hostinger server
ssh your-username@your-server-ip

# Backup current application
cd /path/to/current/app
tar -czf ~/backup-old-radhvi-$(date +%Y%m%d).tar.gz .

# Backup database
mysqldump -u your_db_user -p your_database > ~/backup-db-$(date +%Y%m%d).sql
# OR for PostgreSQL
pg_dump your_database > ~/backup-db-$(date +%Y%m%d).sql

# Download backups to your local machine (from your local terminal)
scp your-username@your-server-ip:~/backup-*.* ./backups/
```

### 2. Prepare Local Code for Deployment

```bash
# On your local machine
cd C:\Users\LENOVO\Desktop\radhvi

# Make sure everything is committed
git status
git add .
git commit -m "Clean project ready for production deployment"
git push origin main
```

### 3. Check What Needs to Be Configured

- [ ] Database (keep existing or create new?)
- [ ] Domain (radhvi.in)
- [ ] SSL certificate
- [ ] Environment variables
- [ ] Static files location
- [ ] Media files location

---

## Deployment Steps

### Step 1: Stop Old Application

```bash
# SSH into server
ssh your-username@your-server-ip

# Find what's running on port 8000
sudo lsof -i :8000
# OR
sudo netstat -tulpn | grep :8000

# Stop the old Django app
# If using systemd service:
sudo systemctl stop old-django-app
sudo systemctl disable old-django-app

# If using PM2:
pm2 stop old-django-app
pm2 delete old-django-app

# If using screen/tmux:
screen -ls  # find the session
screen -X -S session_name quit

# If it's a direct process:
sudo kill -9 <PID>
```

### Step 2: Rename/Move Old Application

```bash
# Don't delete yet - just rename for safety
cd /path/to/apps
mv old-radhvi-app old-radhvi-app-backup-$(date +%Y%m%d)
```

### Step 3: Clone New Application

```bash
# Create new directory
mkdir -p /var/www/radhvi
cd /var/www/radhvi

# Clone from GitHub
git clone https://github.com/your-username/your-repo.git .

# OR if you already have it, pull latest
git pull origin main
```

### Step 4: Set Up Backend (Django)

```bash
cd /var/www/radhvi/gift_project

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn psycopg2-binary  # or mysqlclient if using MySQL

# Create .env file
nano .env
```

**Add to .env:**
```env
DEBUG=False
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=radhvi.in,www.radhvi.in,api.radhvi.in
DATABASE_URL=mysql://user:password@localhost/database_name
# OR
DATABASE_URL=postgresql://user:password@localhost/database_name

CORS_ALLOWED_ORIGINS=https://radhvi.in,https://www.radhvi.in

# Shiprocket
SHIPROCKET_EMAIL=your-email
SHIPROCKET_PASSWORD=your-password

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-app-password

SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

```bash
# Run migrations (use existing database or create new)
python manage.py migrate

# Create superuser (if new database)
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Test backend
gunicorn gift_project.wsgi:application --bind 0.0.0.0:8000
# Press Ctrl+C after testing
```

### Step 5: Set Up Frontend (Next.js)

```bash
cd /var/www/radhvi/frontend

# Install Node.js if not installed (check version)
node --version  # Should be 18+
npm --version

# If Node.js not installed or old version:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

**Add to .env.production:**
```env
NEXT_PUBLIC_API_URL=https://radhvi.in
```

```bash
# Build for production
npm run build

# Test frontend
npm start
# Press Ctrl+C after testing
```

### Step 6: Set Up Process Managers

**Backend (Gunicorn with Systemd):**

```bash
sudo nano /etc/systemd/system/radhvi-backend.service
```

**Add:**
```ini
[Unit]
Description=Radhvi Django Backend
After=network.target

[Service]
User=your-username
Group=www-data
WorkingDirectory=/var/www/radhvi/gift_project
Environment="PATH=/var/www/radhvi/gift_project/venv/bin"
ExecStart=/var/www/radhvi/gift_project/venv/bin/gunicorn \
          --workers 3 \
          --bind unix:/var/www/radhvi/gift_project/gunicorn.sock \
          gift_project.wsgi:application

[Install]
WantedBy=multi-user.target
```

```bash
# Start backend service
sudo systemctl start radhvi-backend
sudo systemctl enable radhvi-backend
sudo systemctl status radhvi-backend
```

**Frontend (PM2):**

```bash
# Install PM2 if not installed
sudo npm install -g pm2

# Start frontend
cd /var/www/radhvi/frontend
pm2 start npm --name "radhvi-frontend" -- start

# Save PM2 configuration
pm2 save
pm2 startup
# Follow the command it gives you
```

### Step 7: Configure Nginx

```bash
# Backup old Nginx config
sudo cp /etc/nginx/sites-available/radhvi /etc/nginx/sites-available/radhvi.old

# Edit Nginx configuration
sudo nano /etc/nginx/sites-available/radhvi
```

**Replace with:**
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name radhvi.in www.radhvi.in;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name radhvi.in www.radhvi.in;

    # SSL Configuration (your existing certificates)
    ssl_certificate /path/to/ssl/fullchain.pem;
    ssl_certificate_key /path/to/ssl/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Next.js Frontend (Main site)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Admin
    location /admin {
        proxy_pass http://unix:/var/www/radhvi/gift_project/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django API
    location /api {
        proxy_pass http://unix:/var/www/radhvi/gift_project/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Static Files
    location /static {
        alias /var/www/radhvi/gift_project/staticfiles;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Django Media Files
    location /media {
        alias /var/www/radhvi/gift_project/media;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
}
```

```bash
# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### Step 8: Verify Deployment

```bash
# Check backend is running
sudo systemctl status radhvi-backend
curl http://localhost:8000/api/  # Should return API response

# Check frontend is running
pm2 status
curl http://localhost:3000  # Should return HTML

# Check Nginx
sudo systemctl status nginx

# Check from outside
curl https://radhvi.in
```

**Visit in browser:**
- https://radhvi.in - Should show Next.js frontend
- https://radhvi.in/admin - Should show Django admin
- https://radhvi.in/api/ - Should show API

---

## Post-Deployment Tasks

### 1. Transfer Data (if needed)

If you want to keep products/data from old site:

```bash
# Export from old database
mysqldump -u user -p old_database products categories > old_data.sql

# Import to new database
mysql -u user -p new_database < old_data.sql
```

### 2. Copy Media Files

```bash
# Copy product images from old to new
cp -r /path/to/old/media/* /var/www/radhvi/gift_project/media/
```

### 3. Set Up Monitoring

```bash
# Check logs regularly
sudo journalctl -u radhvi-backend -f  # Backend logs
pm2 logs radhvi-frontend  # Frontend logs
sudo tail -f /var/log/nginx/error.log  # Nginx errors
```

### 4. Set Up Auto-Updates (Optional)

Create a deployment script:

```bash
nano ~/deploy-radhvi.sh
```

**Add:**
```bash
#!/bin/bash
cd /var/www/radhvi

# Pull latest code
git pull origin main

# Update backend
cd gift_project
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart radhvi-backend

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart radhvi-frontend

echo "Deployment complete!"
```

```bash
chmod +x ~/deploy-radhvi.sh
```

**To deploy updates in future:**
```bash
# On local machine
git add .
git commit -m "Update message"
git push origin main

# On server
~/deploy-radhvi.sh
```

---

## Rollback Plan (If Something Goes Wrong)

```bash
# Stop new services
sudo systemctl stop radhvi-backend
pm2 stop radhvi-frontend

# Restore old application
cd /path/to/apps
mv radhvi radhvi-new-failed
mv old-radhvi-app-backup-YYYYMMDD old-radhvi-app

# Start old application
# (use whatever method you used before)

# Restore old Nginx config
sudo cp /etc/nginx/sites-available/radhvi.old /etc/nginx/sites-available/radhvi
sudo nginx -t
sudo systemctl reload nginx
```

---

## Troubleshooting

### Issue: Port 8000 already in use

```bash
# Find what's using it
sudo lsof -i :8000
sudo kill -9 <PID>
```

### Issue: Permission denied

```bash
# Fix permissions
sudo chown -R your-username:www-data /var/www/radhvi
sudo chmod -R 755 /var/www/radhvi
```

### Issue: Static files not loading

```bash
cd /var/www/radhvi/gift_project
source venv/bin/activate
python manage.py collectstatic --noinput
sudo chown -R www-data:www-data staticfiles/
```

### Issue: Database connection error

```bash
# Check database is running
sudo systemctl status mysql  # or postgresql

# Test connection
mysql -u user -p database_name
```

### Issue: Frontend not building

```bash
cd /var/www/radhvi/frontend
rm -rf .next node_modules
npm install
npm run build
```

---

## Maintenance Commands

### View Logs
```bash
# Backend
sudo journalctl -u radhvi-backend -n 100

# Frontend
pm2 logs radhvi-frontend --lines 100

# Nginx
sudo tail -100 /var/log/nginx/error.log
```

### Restart Services
```bash
# Backend
sudo systemctl restart radhvi-backend

# Frontend
pm2 restart radhvi-frontend

# Nginx
sudo systemctl reload nginx
```

### Check Status
```bash
# All services
sudo systemctl status radhvi-backend
pm2 status
sudo systemctl status nginx
```

---

## Summary

**What This Does:**
1. Stops old Django app (port 8000)
2. Deploys new Next.js frontend (port 3000)
3. Keeps Django backend as API (port 8000 via socket)
4. Updates Nginx to route traffic correctly
5. Keeps your domain radhvi.in working

**Result:**
- radhvi.in → Next.js frontend (beautiful showcase)
- radhvi.in/admin → Django admin (manage products)
- radhvi.in/api → Django API (for frontend)

**Your site will be live with the new architecture, even though cart/checkout isn't ready yet!**

---

**Deployment Type:** Production Replacement
**Downtime:** ~5-10 minutes during switch
**Rollback Time:** ~2-3 minutes if needed
**Status:** Ready to Deploy ✅
