#!/bin/bash

# Server Discovery Script for Radhvi Deployment
# This script gathers all information about the current server setup

echo "=========================================="
echo "RADHVI SERVER DISCOVERY REPORT"
echo "=========================================="
echo "Generated: $(date)"
echo ""

echo "=========================================="
echo "1. DIRECTORY STRUCTURE"
echo "=========================================="
echo "--- /var/www contents ---"
ls -la /var/www/ 2>/dev/null || echo "Directory not found"
echo ""

echo "--- /home contents ---"
ls -la /home/ 2>/dev/null || echo "Directory not found"
echo ""

echo "--- /opt contents ---"
ls -la /opt/ 2>/dev/null || echo "Directory not found"
echo ""

echo "=========================================="
echo "2. FIND ALL DJANGO APPLICATIONS"
echo "=========================================="
find /var/www /home /opt -name "manage.py" -type f 2>/dev/null || echo "No Django apps found"
echo ""

echo "=========================================="
echo "3. LISTENING PORTS"
echo "=========================================="
echo "--- All listening ports ---"
sudo netstat -tulpn | grep LISTEN 2>/dev/null || sudo ss -tulpn | grep LISTEN 2>/dev/null || echo "Could not get port info"
echo ""

echo "=========================================="
echo "4. WEB SERVER PORTS (80/443)"
echo "=========================================="
sudo netstat -tulpn | grep -E ':80|:443' 2>/dev/null || sudo ss -tulpn | grep -E ':80|:443' 2>/dev/null || echo "No web server ports found"
echo ""

echo "=========================================="
echo "5. NGINX CONFIGURATION"
echo "=========================================="
echo "--- Nginx sites-enabled ---"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "Nginx sites-enabled not found"
echo ""

echo "--- Nginx configuration files ---"
for file in /etc/nginx/sites-enabled/*; do
    if [ -f "$file" ]; then
        echo "=== File: $file ==="
        cat "$file"
        echo ""
    fi
done
echo ""

echo "=========================================="
echo "6. RUNNING PROCESSES"
echo "=========================================="
echo "--- Python/Django/Gunicorn/uWSGI processes ---"
ps aux | grep -E 'python|gunicorn|uwsgi|django' | grep -v grep
echo ""

echo "=========================================="
echo "7. SYSTEMD SERVICES"
echo "=========================================="
echo "--- Running services (filtered) ---"
sudo systemctl list-units --type=service --state=running | grep -v 'systemd' | head -30
echo ""

echo "--- Django/Python related services ---"
sudo systemctl list-units --type=service --all | grep -E 'django|python|gunicorn|uwsgi|radhvi'
echo ""

echo "=========================================="
echo "8. PM2 PROCESSES"
echo "=========================================="
pm2 list 2>/dev/null || echo "PM2 not installed or no processes"
echo ""

echo "=========================================="
echo "9. SOFTWARE VERSIONS"
echo "=========================================="
echo "--- Python version ---"
python3 --version 2>/dev/null || echo "Python3 not found"
echo ""

echo "--- Node.js version ---"
node --version 2>/dev/null || echo "Node.js not installed"
echo ""

echo "--- npm version ---"
npm --version 2>/dev/null || echo "npm not installed"
echo ""

echo "--- Nginx version ---"
nginx -v 2>&1 || echo "Nginx not installed"
echo ""

echo "=========================================="
echo "10. DATABASE"
echo "=========================================="
echo "--- MySQL status ---"
sudo systemctl status mysql 2>/dev/null | head -10 || echo "MySQL not running or not installed"
echo ""

echo "--- PostgreSQL status ---"
sudo systemctl status postgresql 2>/dev/null | head -10 || echo "PostgreSQL not running or not installed"
echo ""

echo "=========================================="
echo "11. DISK USAGE"
echo "=========================================="
df -h | grep -E 'Filesystem|/$|/var'
echo ""

echo "=========================================="
echo "12. MEMORY USAGE"
echo "=========================================="
free -h
echo ""

echo "=========================================="
echo "13. CURRENT USER & PERMISSIONS"
echo "=========================================="
echo "Current user: $(whoami)"
echo "User groups: $(groups)"
echo ""

echo "=========================================="
echo "14. GIT REPOSITORIES"
echo "=========================================="
find /var/www /home /opt -name ".git" -type d 2>/dev/null | head -10
echo ""

echo "=========================================="
echo "15. VIRTUAL ENVIRONMENTS"
echo "=========================================="
find /var/www /home /opt -name "venv" -o -name "env" -o -name ".venv" 2>/dev/null | head -10
echo ""

echo "=========================================="
echo "16. SSL CERTIFICATES"
echo "=========================================="
ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "No Let's Encrypt certificates found"
echo ""

echo "=========================================="
echo "17. CRON JOBS"
echo "=========================================="
echo "--- Root crontab ---"
sudo crontab -l 2>/dev/null || echo "No root crontab"
echo ""

echo "=========================================="
echo "DISCOVERY COMPLETE"
echo "=========================================="
echo ""
echo "Save this output and share it for deployment planning."
