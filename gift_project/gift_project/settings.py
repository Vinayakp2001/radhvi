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
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-r6*(+5^wvzugaf$^e&7&z@-nvfg)7$7w0)*kqmy(1u%+6t(a^s')

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
    # API Support for Next.js Frontend
    'rest_framework',
    'rest_framework.authtoken',  # Token authentication
    'corsheaders',
    'django_filters',
]
CRISPY_TEMPLATE_PACK = 'bootstrap4'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS - must be before CommonMiddleware
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
SITE_DOMAIN = os.getenv('SITE_DOMAIN', 'http://localhost:8000')

# Cart Settings
MIN_CART_AMOUNT_FOR_FREE_SHIPPING = 1000
DEFAULT_SHIPPING_CHARGE = 50

# Product Settings
PRODUCTS_PER_PAGE = 12
FEATURED_PRODUCTS_COUNT = 8

# REST Framework Configuration for API
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# CORS Settings for Next.js Frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js development server
    "http://127.0.0.1:3000",
    "https://radhvi.in",      # Production domain
    "https://www.radhvi.in",
]

CORS_ALLOW_CREDENTIALS = True

# Allow all origins during development (remove in production)
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True

# Django REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'PAGE_SIZE': 12,  # Default page size (matches PRODUCTS_PER_PAGE)
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
}

# CORS Settings for Next.js Frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://radhvi.in",
    "https://www.radhvi.in",
]
CORS_ALLOW_CREDENTIALS = True

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
SHIPROCKET_PICKUP_LOCATION = 'Home'  # Must match Shiprocket account
SHIPROCKET_PICKUP_PINCODE = '301001'  # Default pickup pincode

# Warehouse Details (for returns)
SHIPROCKET_WAREHOUSE_ADDRESS = '13, Chandra chaya Colony, opposite Silver Oak'
SHIPROCKET_WAREHOUSE_CITY = 'Alwar'
SHIPROCKET_WAREHOUSE_STATE = 'Rajasthan'
SHIPROCKET_WAREHOUSE_PINCODE = '301001'
SHIPROCKET_WAREHOUSE_PHONE = '9799388840'

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


# ============================================================================
# DJANGO REST FRAMEWORK CONFIGURATION (Consolidated)
# ============================================================================
# Note: This configuration was consolidated from duplicate settings above

# ============================================================================
# CORS CONFIGURATION (for Next.js Frontend)
# ============================================================================

# Allow requests from Next.js frontend
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',  # Next.js development server
    'http://127.0.0.1:3000',
]

# In production, add your production frontend URL:
if not DEBUG:
    CORS_ALLOWED_ORIGINS += [
        'https://radhvi.in',
        'https://www.radhvi.in',
    ]

# Allow credentials (cookies, authorization headers)
CORS_ALLOW_CREDENTIALS = True

# Allow specific headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Allow specific methods
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# CSRF Configuration for API
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

if not DEBUG:
    CSRF_TRUSTED_ORIGINS += [
        'https://radhvi.in',
        'https://www.radhvi.in',
    ]


# ============================================================================
# RAZORPAY PAYMENT GATEWAY CONFIGURATION
# ============================================================================

# Razorpay API Credentials
# Get these from: https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', 'rzp_test_xxxxxxxxxx')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', 'your_secret_key_here')

# Razorpay Settings
RAZORPAY_CURRENCY = 'INR'
RAZORPAY_PAYMENT_TIMEOUT = 900  # 15 minutes in seconds

# Razorpay Webhook Secret (for signature verification)
RAZORPAY_WEBHOOK_SECRET = os.getenv('RAZORPAY_WEBHOOK_SECRET', '')

# ============================================================================
# PHONEPE PAYMENT GATEWAY CONFIGURATION
# ============================================================================

# PhonePe API Credentials
# Get these from: https://developer.phonepe.com/
PHONEPE_MERCHANT_ID = os.getenv('PHONEPE_MERCHANT_ID', 'PGTESTPAYUAT')
PHONEPE_SALT_KEY = os.getenv('PHONEPE_SALT_KEY', '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399')
PHONEPE_SALT_INDEX = os.getenv('PHONEPE_SALT_INDEX', '1')

# PhonePe Environment URLs
# Sandbox: https://api-preprod.phonepe.com/apis/pg-sandbox
# Production: https://api.phonepe.com/apis/hermes
PHONEPE_BASE_URL = os.getenv('PHONEPE_BASE_URL', 'https://api-preprod.phonepe.com/apis/pg-sandbox')

# PhonePe Redirect and Callback URLs
PHONEPE_REDIRECT_URL = f'{SITE_DOMAIN}/orders'
PHONEPE_CALLBACK_URL = f'{SITE_DOMAIN}/api/webhooks/phonepe/'

# PhonePe Settings
PHONEPE_CURRENCY = 'INR'
PHONEPE_PAYMENT_TIMEOUT = 900  # 15 minutes in seconds

# PhonePe Webhook Configuration
PHONEPE_WEBHOOK_SECRET = os.getenv('PHONEPE_WEBHOOK_SECRET', '')

# Payment Gateway Selection (for gradual migration)
# Options: 'razorpay', 'phonepe', 'both' (for A/B testing)
PAYMENT_GATEWAY = os.getenv('PAYMENT_GATEWAY', 'phonepe')

# ============================================================================
# EMAIL CONFIGURATION
# ============================================================================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'radhvi.in@gmail.com')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', 'fdks akca cpss aozh')
DEFAULT_FROM_EMAIL = 'Radhvi Gift Shop <radhvi.in@gmail.com>'

# Admin email for new order notifications (leave blank to disable)
ADMIN_NOTIFICATION_EMAIL = os.getenv('ADMIN_NOTIFICATION_EMAIL', 'radhvi.in@gmail.com')

# Frontend URL (used in email links)
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000' if DEBUG else 'https://radhvi.in')

# ============================================================================
# PAYMENT LOGGING CONFIGURATION
# ============================================================================

# Enhanced logging for payment operations
LOGGING['loggers'].update({
    'gift.payment.phonepe_service': {
        'handlers': ['console'],
        'level': 'INFO',
        'propagate': True,
    },
    'gift.payment.phonepe_webhooks': {
        'handlers': ['console'],
        'level': 'INFO',
        'propagate': True,
    },
    'gift.payment.razorpay_service': {
        'handlers': ['console'],
        'level': 'INFO',
        'propagate': True,
    },
})
