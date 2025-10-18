"""
Development settings for backend project.
These settings are used for local development.
"""
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
    "192.168.0.2",
    "192.168.0.6",
    "192.168.88.218",
    "192.168.88.84",
]

CSRF_TRUSTED_ORIGINS = [
    "http://127.0.0.1",
    "http://localhost",
    "http://192.168.0.6",
    "http://192.168.0.2",
]

# Database configuration for development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': os.environ.get('DB_NAME', 'malog'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'admin'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Static files configuration for development
STATIC_URL = "static/"
STATICFILES_DIRS = [
    BASE_DIR / 'static'
]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / 'media'

# CORS settings for development
CORS_ALLOW_ALL_ORIGINS = True

# Email Configuration for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
FRONTEND_URL = 'http://localhost:3000'

# Development-specific apps
INSTALLED_APPS += [
    'debug_toolbar',
]

# Development-specific middleware
MIDDLEWARE += [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

# Internal IPs for debug toolbar
INTERNAL_IPS = [
    '127.0.0.1',
]
