"""
Django settings for gift_project project.
"""

from pathlib import Path
import os
from django.contrib.messages import constants as messages
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
SECRET_KEY = 'django-insecure-r6*(+5^wvzugaf$^e&7&z@-nvfg)7$7w0)*kqmy(1u%+6t(a^s'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'testserver', '192.168.1.*', 'radhvi.in', 'www.radhvi.in']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'gift',  # Your main app
    'crispy_forms',
    'django.contrib.humanize',
    'django_celery_results',  # For Celery with Django DB
]
CRISPY_TEMPLATE_PACK = 'bootstrap4'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'gift_project.urls'

# Template Configuration
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.media',
                'gift.context_processors.cart_context',
                'gift.context_processors.wishlist_context',
                'gift.context_processors.categories_context',
                'gift.context_processors.campaign_context',  # Valentine's campaign
            ],
        },
    },
]

WSGI_APPLICATION = 'gift_project.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Kolkata'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'  # Where collectstatic will collect files

# Media files (Uploaded files)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Session Configuration
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_SAVE_EVERY_REQUEST = True

# Login/Logout URLs
LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

# Messages Framework
MESSAGE_TAGS = {
    messages.DEBUG: 'alert-secondary',
    messages.INFO: 'alert-info',
    messages.SUCCESS: 'alert-success',
    messages.WARNING: 'alert-warning',
    messages.ERROR: 'alert-danger',
}

# Remove or comment out the logging section for now
# Or fix it like this:

import sys

# Simple logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'stream': sys.stdout,
            'formatter': 'verbose'
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Cache Configuration (Simple)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# File Upload Settings
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB

# Custom Settings
SITE_NAME = "Radhvi"
SITE_DOMAIN = "localhost:8000"

# Cart Settings
MIN_CART_AMOUNT_FOR_FREE_SHIPPING = 1000
DEFAULT_SHIPPING_CHARGE = 50

# Product Settings
PRODUCTS_PER_PAGE = 12
FEATURED_PRODUCTS_COUNT = 8

# Tax Configuration
TAX_PERCENTAGE = 18  # 18% GST

# ============================================================================
# VALENTINE'S DAY CAMPAIGN CONFIGURATION
# ============================================================================
# This configuration controls the Valentine's Day promotional campaign
# Set 'enabled' to False to disable all Valentine's promotional elements

VALENTINE_CAMPAIGN = {
    # Campaign Status
    'enabled': True,  # Master switch - set to False to disable entire campaign
    
    # Campaign Duration
    'start_date': '2026-02-01',  # Format: YYYY-MM-DD
    'end_date': '2026-02-15',    # Format: YYYY-MM-DD
    
    # Discount Configuration
    'discount_code': 'LOVE2026',      # Coupon code for customers
    'discount_percentage': 20,         # Discount percentage (20%)
    
    # Display Settings - Control which promotional elements to show
    'show_announcement_bar': True,     # Top announcement bar
    'show_hero_banner': True,          # Homepage hero banner
    'show_category_card': True,        # Valentine's category card
    'show_promo_section': True,        # Mid-page promotional section
    
    # Content Customization
    'announcement_text': "Valentine's Day Special! Get {discount}% OFF with code {code}",
    'hero_title': "Emotions, Crafted Perfectly",
    'hero_subtitle': "Celebrate love with our exclusive Valentine's collection",
    'promo_title': "Make This Valentine's Day Unforgettable",
    'promo_description': "Express your love with our handpicked collection of premium gifts.",
    
    # Category Configuration
    'category_slug': 'valentines',     # URL slug for Valentine's category
    'category_name': "Valentine's Special",
}

# Note: To disable the campaign after Valentine's Day, simply set:
# VALENTINE_CAMPAIGN['enabled'] = False
# Or let it auto-disable based on end_date

# ============================================================================
# SHIPROCKET CONFIGURATION
# ============================================================================

# API Credentials (use environment variables in production)
SHIPROCKET_EMAIL = os.getenv('SHIPROCKET_EMAIL', '')
SHIPROCKET_PASSWORD = os.getenv('SHIPROCKET_PASSWORD', '')
SHIPROCKET_API_URL = 'https://apiv2.shiprocket.in/v1/external'

# Test/Production Mode
SHIPROCKET_TEST_MODE = DEBUG  # Use test credentials in development

# Pickup Location
SHIPROCKET_PICKUP_LOCATION = 'Primary'  # Must match Shiprocket account
SHIPROCKET_PICKUP_PINCODE = '110001'  # Default pickup pincode

# Warehouse Details (for returns)
SHIPROCKET_WAREHOUSE_ADDRESS = 'Warehouse Address'
SHIPROCKET_WAREHOUSE_CITY = 'Delhi'
SHIPROCKET_WAREHOUSE_STATE = 'Delhi'
SHIPROCKET_WAREHOUSE_PINCODE = '110001'
SHIPROCKET_WAREHOUSE_PHONE = '9999999999'

# Default Package Settings
SHIPROCKET_DEFAULT_WEIGHT = 0.5  # kg (if product weight missing)
SHIPROCKET_DEFAULT_DIMENSIONS = {
    'length': 20,  # cm
    'breadth': 15,  # cm
    'height': 10,  # cm
}

# Courier Preferences
SHIPROCKET_COURIER_PREFERENCE = 'cost'  # Options: 'cost', 'speed', 'rating'
SHIPROCKET_PREFERRED_COURIERS = []  # List of courier IDs to prefer

# Rate Calculation
SHIPROCKET_RATE_CACHE_TTL = 900  # 15 minutes
SHIPROCKET_ENABLE_COD = True

# Webhook Configuration
SHIPROCKET_WEBHOOK_SECRET = os.getenv('SHIPROCKET_WEBHOOK_SECRET', '')
SHIPROCKET_WEBHOOK_URL = f'{SITE_DOMAIN}/api/webhooks/shiprocket/'

# Retry Configuration
SHIPROCKET_MAX_RETRIES = 3
SHIPROCKET_RETRY_DELAY = 2  # seconds
SHIPROCKET_TIMEOUT = 30  # seconds

# Background Tasks
SHIPROCKET_TRACKING_UPDATE_INTERVAL = 7200  # 2 hours
SHIPROCKET_RATE_CACHE_REFRESH_INTERVAL = 21600  # 6 hours

# Notifications
SHIPROCKET_NOTIFY_ON_SYNC_FAILURE = True
SHIPROCKET_ADMIN_EMAIL = 'admin@radhvi.com'

# Logging
SHIPROCKET_LOG_REQUESTS = DEBUG
SHIPROCKET_LOG_RESPONSES = DEBUG

# ============================================================================
# CELERY CONFIGURATION
# ============================================================================

# Celery Broker (Memory - simplest for Windows development)
# For production, use Redis or RabbitMQ
CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = 'django-db'
CELERY_CACHE_BACKEND = 'django-cache'
CELERY_TASK_ALWAYS_EAGER = False  # Set to True to run tasks synchronously for testing

# Alternative: Use Redis if available (uncomment if Redis is installed)
# CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
# CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Celery Settings
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Celery Beat Schedule
CELERY_BEAT_SCHEDULE = {
    'update-shipment-tracking': {
        'task': 'gift.shipping.tasks.update_all_shipments_tracking',
        'schedule': 7200.0,  # Every 2 hours
    },
    'cleanup-expired-rates': {
        'task': 'gift.shipping.tasks.cleanup_expired_rates',
        'schedule': 21600.0,  # Every 6 hours
    },
    'retry-failed-syncs': {
        'task': 'gift.shipping.tasks.sync_pending_orders',
        'schedule': 1800.0,  # Every 30 minutes
    },
    'retry-failed-shipments': {
        'task': 'gift.shipping.tasks.retry_failed_shipments',
        'schedule': 1800.0,  # Every 30 minutes
    },
}
