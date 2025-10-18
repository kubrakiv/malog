"""
Production settings for backend project.
These settings are used for production environment.
"""
from .base import *

DEBUG = False

ALLOWED_HOSTS = [
    "deltalogistics.cz",
    "www.deltalogistics.cz",
    "195.201.96.160",
]

CSRF_TRUSTED_ORIGINS = [
    "https://deltalogistics.cz",
    "http://deltalogistics.cz",
    "https://195.201.96.160",
    "http://195.201.96.160",
]

# Database configuration for production
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_HOST'],
        'PORT': os.environ['DB_PORT'],
    }
}

# Static files configuration for production
STATIC_URL = "/assets/"
STATIC_ROOT = BASE_DIR / 'staticfiles'

STATICFILES_DIRS = [
    BASE_DIR / 'static',
    BASE_DIR / 'frontend/build/assets/',
]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / 'media'

# CORS settings for production
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://malog.com.ua",
    "http://malog.com.ua",
]

# Email Configuration for production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_SENDER')
EMAIL_HOST_PASSWORD = os.environ.get('GMAIL_PASSWORD')

FRONTEND_URL = 'https://malog.com.ua'

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'

# HSTS settings
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_PRELOAD = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True


# Performance optimizations for production
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
