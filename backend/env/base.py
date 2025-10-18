"""
Base Django settings for backend project.
This file contains settings that are common across all environments.
"""
from datetime import timedelta
from pathlib import Path
import os
import secrets
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from the appropriate .env file
# Priority:
# 1) ENV_FILE explicitly set (absolute or relative to BASE_DIR)
# 2) Based on DJANGO_SETTINGS_MODULE suffix: dev->.env, staging->.env.staging, prod->.env.prod
# 3) Fallback to .env
dj_settings = os.environ.get('DJANGO_SETTINGS_MODULE', 'backend.env.dev')

env_file = BASE_DIR / '.env'
if dj_settings.endswith('.staging') or dj_settings.endswith('staging'):
    env_file = BASE_DIR / '.env.staging'
elif dj_settings.endswith('.prod') or dj_settings.endswith('prod'):
    env_file = BASE_DIR / '.env.prod'

override_env_file = os.environ.get('ENV_FILE')
if override_env_file:
    # Allow absolute path or path relative to BASE_DIR
    env_file = Path(override_env_file)
    if not env_file.is_absolute():
        env_file = BASE_DIR / override_env_file

load_dotenv(env_file)

# SECURITY WARNING: keep the secret key used in production secret!
# If SECRET_KEY is not in environment variables, raise an error in production
# but use a temporary one for development
if 'SECRET_KEY' not in os.environ:
    # For staging and production we require SECRET_KEY to be present
    if os.environ.get('DJANGO_SETTINGS_MODULE') in (
        'backend.env.prod',
        'backend.env.staging',
    ):
        raise Exception('SECRET_KEY environment variable is required in staging/production')
    # Generate a temporary secret key for development only
    print("WARNING: Using a temporary SECRET_KEY. Set SECRET_KEY in .env for development.")
    os.environ['SECRET_KEY'] = secrets.token_urlsafe(50)

SECRET_KEY = os.environ['SECRET_KEY']

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    'drf_spectacular',
    "corsheaders",
    "base.apps.BaseConfig",
    "user.apps.UserConfig",
    "route_calculator.apps.RouteCalculatorConfig",
    "django_extensions",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SIMPLE_JWT = {
    # It will work instead of the default serializer(TokenObtainPairSerializer).
    "TOKEN_OBTAIN_SERIALIZER": "my_app.serializers.MyTokenObtainPairSerializer",

    "ACCESS_TOKEN_LIFETIME": timedelta(days=90),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
    "UPDATE_LAST_LOGIN": False,

    "ALGORITHM": "HS256",
    "VERIFYING_KEY": "",
    "AUDIENCE": None,
    "ISSUER": None,
    "JSON_ENCODER": None,
    "JWK_URL": None,
    "LEEWAY": 0,

    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",

    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",

    "JTI_CLAIM": "jti",

    "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
    "SLIDING_TOKEN_LIFETIME": timedelta(minutes=5),
    "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=1),

    "TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSerializer",
    "TOKEN_VERIFY_SERIALIZER": "rest_framework_simplejwt.serializers.TokenVerifySerializer",
    "TOKEN_BLACKLIST_SERIALIZER": "rest_framework_simplejwt.serializers.TokenBlacklistSerializer",
    "SLIDING_TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainSlidingSerializer",
    "SLIDING_TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSlidingSerializer",
}

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "base.middleware.TenantMiddleware",  # Add tenant middleware after authentication
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "delta-frontend/build")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

# Database configuration will be set in environment-specific settings
DATABASES = {}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Default auto field
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Custom user model
AUTH_USER_MODEL = "user.Profile"

# Email Configuration - will be overridden in environment-specific settings
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
DEFAULT_FROM_EMAIL = 'noreply@malog.com'
SYSTEM_ADMIN_EMAIL = 'admin@malog.com'
