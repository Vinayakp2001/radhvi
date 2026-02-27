# Deploy Current Version - Quick Launch Guide

## Overview

This guide helps you deploy the current state of your Radhvi platform to production. This is a **showcase/catalog deployment** - customers can browse products but cannot purchase yet. Full e-commerce functionality (cart, checkout, payments) will be added in the next update.

---

## What's Included in This Deployment

### ✅ Working Features
- Beautiful Next.js frontend with responsive design
- Product catalog with categories and collections
- Product detail pages with image galleries
- Search functionality
- Wishlist (view-only for now)
- Occasions and bestsellers sections
- Blog pages (placeholder)
- Contact information
- Django admin for managing products
- Shiprocket integration (ready for next phase)

### ⚠️ Not Included (Coming in Next Update)
- User authentication (login/register)
- Shopping cart functionality
- Checkout process
- Payment processing
- Order management
- Email notifications

---

## Deployment Strategy

You have two options:

### Option 1: Quick Deploy (Recommended for Testing)
Deploy to free hosting platforms to test everything works in production.

**Timeline:** 2-3 hours

### Option 2: Production Deploy
Deploy to your existing radhvi.in server with proper configuration.

**Timeline:** 4-6 hours

---

## Option 1: Quick Deploy to Free Platforms

### Step 1: Deploy Backend to Railway/Render

**Using Railway (Recommended):**

1. **Sign up:** https://railway.app/
2. **Create New Project** → Deploy from GitHub
3. **Connect your repository**
4. **Add PostgreSQL database** (Railway provides this)
5. **Set environment variables:**

```env
DEBUG=False
SECRET_KEY=your-generated-secret-key
ALLOWED_HOSTS=your-app.railway.app
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app

# Shiprocket (for next phase)
SHIPROCKET_EMAIL=your-email
SHIPROCKET_PASSWORD=your-password

# Email (for next phase)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-app-password
```

6. **Deploy** - Railway will automatically:
   - Install dependencies
   - Run migrations
   - Start the server

7. **Run initial setup:**
   - Open Railway shell
   - Run: `python manage.py createsuperuser`
   - Run: `python manage.py add_sample_homepage_data`

### Step 2: Deploy Frontend to Vercel

1. **Sign up:** https://vercel.com/
2. **Import your repository**
3. **Configure:**
   - Framework: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Set environment variables:**

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

5. **Deploy** - Vercel will build and deploy automatically

### Step 3: Update CORS Settings

Go back to Railway and update CORS:

```env
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-frontend-git-main.vercel.app
```

### Step 4: Test Your Deployment

Visit your Vercel URL and verify:
- [ ] Homepage loads
- [ ] Products display
- [ ] Product detail pages work
- [ ] Search works
- [ ] Images load correctly
- [ ] Navigation works
- [ ] Mobile responsive

---

## Option 2: Deploy to Your Server (radhvi.in)

### Prerequisites

- Server access (SSH)
- Domain: radhvi.in
- Ubuntu/Debian server
- Root or sudo access

### Step 1: Prepare Your Server

```bash
# SSH into your server
ssh user@radhvi.in

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3-pip python3-venv nginx postgresql redis-server nodejs npm

# Install PM2 for process management
sudo npm install -g pm2
```

### Step 2: Set Up Database

```bash
# Create PostgreSQL database
sudo -u postgres psql

CREATE DATABASE radhvi_db;
CREATE USER radhvi_user WITH PASSWORD 'your-secure-password';
ALTER ROLE radhvi_user SET client_encoding TO 'utf8';
ALTER ROLE radhvi_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE radhvi_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE radhvi_db TO radhvi_user;
\q
```

### Step 3: Deploy Django Backend

```bash
# Create app directory
sudo mkdir -p /var/www/radhvi
sudo chown $USER:$USER /var/www/radhvi
cd /var/www/radhvi

# Clone your repository (or upload files)
git clone your-repo-url .
# OR upload via SCP/FTP

# Set up Python environment
cd gift_project
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Create .env file
nano .env
```

**Add to .env:**
```env
DEBUG=False
SECRET_KEY=your-generated-secret-key-here
ALLOWED_HOSTS=radhvi.in,www.radhvi.in,api.radhvi.in
DATABASE_URL=postgresql://radhvi_user:your-secure-password@localhost/radhvi_db
CORS_ALLOWED_ORIGINS=https://radhvi.in,https://www.radhvi.in

SHIPROCKET_EMAIL=your-email
SHIPROCKET_PASSWORD=your-password

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@radhvi.in

SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Add sample data
python manage.py add_sample_homepage_data

# Test the server
gunicorn gift_project.wsgi:application --bind 0.0.0.0:8000
# Press Ctrl+C after testing
```

### Step 4: Set Up Gunicorn Service

```bash
# Create systemd service
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
# Start and enable service
sudo systemctl start radhvi-backend
sudo systemctl enable radhvi-backend
sudo systemctl status radhvi-backend
```

### Step 5: Deploy Next.js Frontend

```bash
# Navigate to frontend directory
cd /var/www/radhvi/frontend

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

**Add:**
```env
NEXT_PUBLIC_API_URL=https://radhvi.in
```

```bash
# Build for production
npm run build

# Start with PM2
pm2 start npm --name "radhvi-frontend" -- start
pm2 save
pm2 startup
```

### Step 6: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/radhvi
```

**Add:**
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

    # SSL Configuration (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/radhvi.in/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/radhvi.in/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Next.js Frontend
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
# Enable site
sudo ln -s /etc/nginx/sites-available/radhvi /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 7: Set Up SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d radhvi.in -d www.radhvi.in

# Follow prompts and select redirect HTTP to HTTPS

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 8: Set Up Firewall

```bash
# Configure UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

## Post-Deployment Tasks

### 1. Add Your Products

```bash
# Access Django admin
https://radhvi.in/admin

# Login with superuser credentials
# Add your products, categories, occasions
```

### 2. Upload Product Images

- Use Django admin to upload product images
- Or use the bulk import feature if you have many products

### 3. Test Everything

- [ ] Homepage loads
- [ ] All pages accessible
- [ ] Products display correctly
- [ ] Images load
- [ ] Search works
- [ ] Mobile responsive
- [ ] Admin panel accessible
- [ ] SSL certificate valid

### 4. Set Up Monitoring (Optional but Recommended)

```bash
# Install monitoring tools
pip install sentry-sdk

# Add to Django settings.py
import sentry_sdk
sentry_sdk.init(dsn="your-sentry-dsn")
```

### 5. Set Up Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-radhvi.sh
```

**Add:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/radhvi"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump radhvi_db > $BACKUP_DIR/db_$DATE.sql

# Backup media files
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /var/www/radhvi/gift_project/media

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "media_*.tar.gz" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-radhvi.sh

# Add to crontab
sudo crontab -e

# Add line (runs daily at 2 AM)
0 2 * * * /usr/local/bin/backup-radhvi.sh
```

---

## Maintenance Commands

### Check Service Status
```bash
# Backend
sudo systemctl status radhvi-backend

# Frontend
pm2 status

# Nginx
sudo systemctl status nginx

# Database
sudo systemctl status postgresql
```

### View Logs
```bash
# Backend logs
sudo journalctl -u radhvi-backend -f

# Frontend logs
pm2 logs radhvi-frontend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart Services
```bash
# Backend
sudo systemctl restart radhvi-backend

# Frontend
pm2 restart radhvi-frontend

# Nginx
sudo systemctl restart nginx
```

### Update Code
```bash
# Pull latest changes
cd /var/www/radhvi
git pull

# Backend updates
cd gift_project
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart radhvi-backend

# Frontend updates
cd ../frontend
npm install
npm run build
pm2 restart radhvi-frontend
```

---

## Troubleshooting

### Issue: Site not loading
```bash
# Check if services are running
sudo systemctl status radhvi-backend
pm2 status
sudo systemctl status nginx

# Check logs for errors
sudo journalctl -u radhvi-backend -n 50
pm2 logs radhvi-frontend --lines 50
```

### Issue: 502 Bad Gateway
```bash
# Check Gunicorn socket
ls -la /var/www/radhvi/gift_project/gunicorn.sock

# Check Nginx configuration
sudo nginx -t

# Restart services
sudo systemctl restart radhvi-backend
sudo systemctl restart nginx
```

### Issue: Static files not loading
```bash
# Recollect static files
cd /var/www/radhvi/gift_project
source venv/bin/activate
python manage.py collectstatic --noinput

# Check permissions
sudo chown -R www-data:www-data staticfiles/
```

### Issue: Database connection error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l

# Test connection
sudo -u postgres psql radhvi_db
```

---

## What to Tell Your Customers

Add a notice on your site:

**Homepage Banner:**
```
🎉 Welcome to Radhvi! Browse our beautiful gift collection. 
Online ordering coming soon! For orders, please WhatsApp us at [your-number]
```

**Product Pages:**
```
💝 Love this product? Contact us on WhatsApp to place your order!
[WhatsApp Button]
```

This way you can:
- Showcase your products professionally
- Build your brand presence
- Collect customer interest
- Take orders manually while you complete the e-commerce features

---

## Next Update Roadmap

Once this is live and stable, we'll add:

1. **User Authentication** (2-3 days)
   - Login/Register
   - Password reset
   - User profiles

2. **Shopping Cart** (2-3 days)
   - Add to cart
   - Cart management
   - Persistent cart

3. **Checkout & Payments** (3-4 days)
   - Checkout flow
   - Razorpay integration
   - Order confirmation

4. **Order Management** (2-3 days)
   - Order tracking
   - Email notifications
   - Admin order management

**Total for next update:** 10-15 days

---

## Success Checklist

Before announcing your site:

- [ ] All products added with images
- [ ] Categories configured
- [ ] Contact information updated
- [ ] WhatsApp number added
- [ ] Social media links added
- [ ] About page content added
- [ ] SSL certificate active
- [ ] Mobile tested
- [ ] Desktop tested
- [ ] Load time < 3 seconds
- [ ] Backups configured
- [ ] Monitoring set up

---

## Support

If you encounter issues:

1. Check the logs first
2. Verify environment variables
3. Test API endpoints directly
4. Check Nginx configuration
5. Review Django settings

**Your site will be a beautiful product showcase that builds your brand while you complete the full e-commerce features!**

---

**Deployment Type:** Catalog/Showcase
**E-Commerce Features:** Coming in Next Update
**Timeline:** 2-6 hours (depending on option chosen)
**Status:** Ready to Deploy ✅
