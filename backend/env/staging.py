"""
Staging settings for backend project.
These settings are used for staging environment.
"""
from .base import *

DEBUG = False

ALLOWED_HOSTS = [
    "test.malog.com.ua",
    "www.test.malog.com.ua",
    "test-tms.sovtes.com",
    "91.98.164.83",
]

CSRF_TRUSTED_ORIGINS = [
    "https://test.malog.com.ua",
    "http://test.malog.com.ua",
    "https://test-tms.sovtes.com",
    "http://test-tms.sovtes.com",
    "https://91.98.164.83",
    "http://91.98.164.83",
]

# Database configuration for staging
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

# Static files configuration for staging
STATIC_URL = "/assets/"
STATIC_ROOT = BASE_DIR / 'staticfiles'

STATICFILES_DIRS = [
    BASE_DIR / 'static',
    BASE_DIR / 'frontend/build/assets/',
]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / 'media'

# CORS settings for staging
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://test.malog.com.ua",
    "http://test.malog.com.ua",
    "https://test-tms.sovtes.com",
    "http://test-tms.sovtes.com",
]

# Email Configuration for staging
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_SENDER')
EMAIL_HOST_PASSWORD = os.environ.get('GMAIL_PASSWORD')

FRONTEND_URL = 'https://test-tms.sovtes.com'

# Basic security settings for staging
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "loggers": {
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
        "django.server":  {"handlers": ["console"], "level": "ERROR", "propagate": False},
    },
}


