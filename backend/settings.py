"""
Django settings module selector.

This file determines which settings module to use based on the DJANGO_SETTINGS_MODULE
environment variable. If not set, it defaults to development settings.

To use different environments:
- Development: Set DJANGO_SETTINGS_MODULE=backend.settings.dev (default)
- Staging: Set DJANGO_SETTINGS_MODULE=backend.settings.staging
- Production: Set DJANGO_SETTINGS_MODULE=backend.settings.prod
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the settings module from environment variable or default to dev
settings_module = os.environ.get('DJANGO_SETTINGS_MODULE', 'backend.settings.dev')

# Define required environment variables for production and staging
if settings_module in ['backend.settings.staging', 'backend.settings.prod']:
    required_vars = ['SECRET_KEY', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT']
    missing = [var for var in required_vars if var not in os.environ]
    if missing:
        print(f"ERROR: Missing required environment variables for {settings_module}: {', '.join(missing)}")
        print("Please check your .env file and ensure all required variables are set.")
        sys.exit(1)

# Import all settings from the appropriate module
if settings_module == 'backend.settings.dev':
    from .settings.dev import *
elif settings_module == 'backend.settings.staging':
    from .settings.staging import *
elif settings_module == 'backend.settings.prod':
    from .settings.prod import *
else:
    # Fallback to dev if unknown module
    from .settings.dev import *

