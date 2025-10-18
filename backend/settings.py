"""
Django settings module selector.

This file determines which settings module to use based on the DJANGO_SETTINGS_MODULE
environment variable. If not set, it defaults to development settings.

We migrated environment-specific settings to the package `backend.env`.
This selector keeps backward compatibility with previous values
(`backend.settings.dev|staging|prod`) by mapping them to `backend.env.*`.

To use different environments:
- Development: DJANGO_SETTINGS_MODULE=backend.env.dev (default)
- Staging:     DJANGO_SETTINGS_MODULE=backend.env.staging
- Production:  DJANGO_SETTINGS_MODULE=backend.env.prod
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def _normalize(module: str) -> str:
    """Map old module paths (backend.settings.*) to new ones (backend.env.*)."""
    if module.startswith('backend.settings.'):
        suffix = module.split('.')[-1]
        if suffix in ('dev', 'staging', 'prod'):
            return f'backend.env.{suffix}'
    if module == 'backend.settings':
        # Default to dev
        return 'backend.env.dev'
    return module

# Get the settings module from environment variable or default to dev
settings_module = _normalize(os.environ.get('DJANGO_SETTINGS_MODULE', 'backend.env.dev'))

# Define required environment variables for production and staging
if settings_module in ['backend.env.staging', 'backend.env.prod']:
    required_vars = ['SECRET_KEY', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT']
    missing = [var for var in required_vars if var not in os.environ]
    if missing:
        print(f"ERROR: Missing required environment variables for {settings_module}: {', '.join(missing)}")
        print("Please check your .env file and ensure all required variables are set.")
        sys.exit(1)

# Import all settings from the appropriate module
if settings_module == 'backend.env.dev':
    from .env.dev import *
elif settings_module == 'backend.env.staging':
    from .env.staging import *
elif settings_module == 'backend.env.prod':
    from .env.prod import *
else:
    # Fallback to dev if unknown module
    from .env.dev import *

