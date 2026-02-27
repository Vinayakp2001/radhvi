# Dual Deployment Strategy - Run Both Old & New Together

## Overview

Deploy new Next.js architecture as main site while keeping old Django site running as backup until full e-commerce features are complete.

---

## Architecture Plan

```
CURRENT (Before):
radhvi.in → Old Django (port 8000) - LIVE

AFTER DEPLOYMENT:
radhvi.in → New Next.js (port 3000) - MAIN SITE (showcase)
old.radhvi.in → Old Django (port 8000) - BACKUP (for orders)
OR
radhvi.in:8000 → Old Django - BACKUP (for orders)
```

---

## Benefits of This Approach

✅ **Zero Risk** - Old site stays functional
✅ **Professional Look** - New site shows modern design
✅ **Business Continuity** - Can still take orders via old site
✅ **Testing** - Test new site with real traffic
✅ **Gradual Migration** - Move customers slowly
✅ **Easy Rollback** - Just switch Nginx config

---

## Deployment Steps

### Step 1: Backup Everything

```bash
# SSH into server
ssh your-username@your-server-ip

# Backup current site
cd /path/to/current/django/app
tar -czf ~/backup-old-site-$(date +%Y%m%d).tar.gz .

# Backup database
mysqldump -u user -p database > ~/backup-db-$(date +%Y%m%d).sql
```

### Step 2: Keep Old Site Running (Don't Stop It!)

```bash
# Check what's running on port 8000
sudo lsof -i :8000

# Note the process - DON'T STOP IT
# We'll just change Nginx routing
```

### Step 3: Deploy New Application

```bash
# Create new directory (separate from old)
sudo mkdir -p /var/www/radhvi-new
cd /var/www/radhvi-new

# Clone from GitHub
git clone https://github.com/your-username/your-repo.git .

# Set up backend
cd gift_project
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Create .env
nano .env
```

**Backend .env:**
```env
DEBUG=False
SECRET_KEY=your-new-secret-key
ALLOWED_HOSTS=radhvi.in,www.radhvi.in
DATABASE_URL=mysql://user:password@localhost/radhvi_new_db
CORS_ALLOWED_ORIGINS=https://radhvi.in,https://www.radhvi.in

SHIPROCKET_EMAIL=your-email
SHIPROCKET_PASSWORD=your-password

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-app-password

SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

```bash
# Run migrations (NEW database - don't touch old one)
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Add sample data
python manage.py add_sample_homepage_data
```

### Step 4: Set Up New Backend Service

```bash
sudo nano /etc/systemd/system/radhvi-new-backend.service
```

**Add:**
```ini
[Unit]
Description=Radhvi New Backend API
After=network.target

[Service]
User=your-username
Group=www-data
WorkingDirectory=/var/www/radhvi-new/gift_project
Environment="PATH=/var/www/radhvi-new/gift_project/venv/bin"
ExecStart=/var/www/radhvi-new/gift_project/venv/bin/gunicorn \
          --workers 3 \
          --bind unix:/var/www/radhvi-new/gift_project/gunicorn.sock \
          gift_project.wsgi:application

[Install]
WantedBy=multi-user.target
```

```bash
# Start new backend
sudo systemctl start radhvi-new-backend
sudo systemctl enable radhvi-new-backend
sudo systemctl status radhvi-new-backend
```

### Step 5: Set Up Frontend

```bash
cd /var/www/radhvi-new/frontend

# Install dependencies
npm install

# Create production env
nano .env.production
```

**Add:**
```env
NEXT_PUBLIC_API_URL=https://radhvi.in
```

```bash
# Build
npm run build

# Start with PM2
pm2 start npm --name "radhvi-new-frontend" -- start
pm2 save
```

### Step 6: Configure Nginx for Dual Setup

```bash
# Backup current Nginx config
sudo cp /etc/nginx/sites-available/radhvi /etc/nginx/sites-available/radhvi.backup

# Edit Nginx config
sudo nano /etc/nginx/sites-available/radhvi
```

**Replace with this dual configuration:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name radhvi.in www.radhvi.in old.radhvi.in;
    return 301 https://$server_name$request_uri;
}

# OLD SITE - Backup for orders (accessible via old.radhvi.in)
server {
    listen 443 ssl http2;
    server_name old.radhvi.in;

    # SSL Configuration
    ssl_certificate /path/to/ssl/fullchain.pem;
    ssl_certificate_key /path/to/ssl/privkey.pem;

    # Old Django app on port 8000
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Old static files
    location /static {
        alias /path/to/old/staticfiles;
        expires 30d;
    }

    # Old media files
    location /media {
        alias /path/to/old/media;
        expires 30d;
    }
}

# NEW SITE - Main site (radhvi.in)
server {
    listen 443 ssl http2;
    server_name radhvi.in www.radhvi.in;

    # SSL Configuration
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

    # New Django Admin
    location /admin {
        proxy_pass http://unix:/var/www/radhvi-new/gift_project/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # New Django API
    location /api {
        proxy_pass http://unix:/var/www/radhvi-new/gift_project/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # New Static Files
    location /static {
        alias /var/www/radhvi-new/gift_project/staticfiles;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # New Media Files
    location /media {
        alias /var/www/radhvi-new/gift_project/media;
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

### Step 7: Set Up DNS for old.radhvi.in (Optional)

If you want old.radhvi.in subdomain:

1. Go to your Hostinger DNS settings
2. Add A record:
   - Name: `old`
   - Type: `A`
   - Value: Your server IP
   - TTL: 3600

Wait 5-10 minutes for DNS propagation.

**OR** just use port access: `radhvi.in:8000` (no DNS needed)

---

## What Customers See

### Main Site (radhvi.in)
- Beautiful Next.js frontend
- Product catalog
- Search, filters, categories
- Product details
- Wishlist (view only)
- Professional, modern design

**Banner Message:**
```
🎉 Welcome to our new website! 
Browse our collection. To place orders, please contact us via WhatsApp.
[WhatsApp Button]
```

### Old Site (old.radhvi.in or radhvi.in:8000)
- Full e-commerce functionality
- Cart, checkout, payments
- Order management
- Use this for actual orders until new site is complete

---

## Copy Products from Old to New

```bash
# Export products from old database
mysqldump -u user -p old_database gift_product gift_category gift_occasion > products.sql

# Import to new database
mysql -u user -p new_database < products.sql

# Copy product images
cp -r /path/to/old/media/products /var/www/radhvi-new/gift_project/media/
```

---

## Monitoring Both Sites

```bash
# Check old site (port 8000)
curl http://localhost:8000
sudo lsof -i :8000

# Check new backend
sudo systemctl status radhvi-new-backend
curl http://localhost:8001  # or whatever socket

# Check new frontend
pm2 status
curl http://localhost:3000

# Check Nginx
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Transition Plan

### Phase 1: Now (Dual Running)
- New site: Showcase, browsing, catalog
- Old site: Orders, payments, checkout
- Duration: Until cart/checkout complete (~2-4 weeks)

### Phase 2: Testing (After cart/checkout done)
- Test new cart/checkout thoroughly
- Process test orders
- Verify payment integration
- Duration: 1 week

### Phase 3: Gradual Migration
- Announce new checkout on main site
- Keep old site as backup
- Monitor for issues
- Duration: 1-2 weeks

### Phase 4: Full Switch
- All traffic to new site
- Stop old site
- Remove old code
- Duration: 1 day

---

## Quick Rollback (If Needed)

If new site has issues, switch back instantly:

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/radhvi

# Change main server block to point to old site
server {
    listen 443 ssl http2;
    server_name radhvi.in www.radhvi.in;
    
    location / {
        proxy_pass http://localhost:8000;  # Back to old site
        # ... rest of config
    }
}

# Reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

**Rollback time: 30 seconds!**

---

## Update Process (Future)

When you push updates:

```bash
# On local machine
git add .
git commit -m "Update message"
git push origin main

# On server
cd /var/www/radhvi-new
git pull origin main

# Update backend
cd gift_project
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart radhvi-new-backend

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart radhvi-new-frontend
```

---

## When to Remove Old Site

Remove old site when:
- ✅ Cart functionality complete
- ✅ Checkout working perfectly
- ✅ Payment integration tested
- ✅ Order management working
- ✅ Email notifications working
- ✅ No critical bugs for 2 weeks
- ✅ Customer feedback positive

**Then:**
```bash
# Stop old site
sudo systemctl stop old-django-service
# OR
pm2 stop old-django-app

# Remove old Nginx config
sudo nano /etc/nginx/sites-available/radhvi
# Remove old.radhvi.in server block

# Reload Nginx
sudo nginx -t
sudo systemctl reload nginx

# Archive old code
cd /path/to/old/app
tar -czf ~/old-site-archived-$(date +%Y%m%d).tar.gz .
rm -rf /path/to/old/app
```

---

## Cost & Resources

**Server Resources Needed:**
- RAM: +1GB (for running both)
- Disk: +500MB (for new code)
- CPU: Minimal increase

**Ports Used:**
- 8000: Old Django (direct or via socket)
- 3000: New Next.js
- 443: Nginx (HTTPS)
- 80: Nginx (HTTP redirect)

---

## Summary

**What This Strategy Does:**

✅ **New site goes live** - Customers see modern design
✅ **Old site stays running** - Can still process orders
✅ **Zero downtime** - Seamless transition
✅ **Low risk** - Easy rollback if needed
✅ **Gradual migration** - Test with real traffic
✅ **Business continuity** - Never lose ability to sell

**URLs:**
- `radhvi.in` → New Next.js (showcase)
- `old.radhvi.in` → Old Django (orders)
- `radhvi.in/admin` → New Django admin

**Perfect for your situation!** 🎉

---

**Deployment Type:** Dual Running (Safe Migration)
**Risk Level:** Very Low
**Downtime:** 0 minutes
**Rollback Time:** 30 seconds
**Status:** Ready to Deploy ✅
