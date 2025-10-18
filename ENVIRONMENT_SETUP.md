# Environment Management Guide

This Django project uses a split settings configuration to manage different environments (development, staging, production). This guide explains how to use and deploy the different configurations.

## Settings Structure

```
backend/settings/
├── __init__.py
├── base.py          # Common settings for all environments
├── dev.py           # Development settings
├── staging.py       # Staging environment settings
└── prod.py          # Production environment settings
```

## Environment Configuration

### 1. Development (Local)

**Default environment** - no additional configuration needed.

- **Settings Module**: `backend.env.dev`
- **Debug**: `True`
- **Database**: Local PostgreSQL
- **Static Files**: Served by Django
- **CORS**: Allow all origins
- **Email**: Console backend

### 2. Staging

For staging deployment:

1. Copy `.env.staging` to `.env` on your staging server
2. Update the values in `.env` with your staging credentials
3. Set `DJANGO_SETTINGS_MODULE=backend.env.staging`

**Key differences from development:**

- **Debug**: `False`
- **Allowed Hosts**: `test.malog.com.ua`, `91.98.164.83`
- **HTTPS Settings**: Basic security headers
- **Email**: SMTP backend
- **Static Files**: Collected to `staticfiles/`
- **Logging**: File and console logging

### 3. Production

For production deployment:

1. Copy `.env.production` to `.env` on your production server
2. Update the values in `.env` with your production credentials
3. Set `DJANGO_SETTINGS_MODULE=backend.env.prod`

**Key differences from staging:**

- **Allowed Hosts**: `deltalogistics.cz`, `195.201.96.160`
- **Security**: Full HTTPS enforcement, HSTS headers
- **Database**: Different port (5435) and database name
- **Logging**: Warning level and above only

## Environment Variables

All sensitive configuration is stored in `.env` files:

```bash
# Required for all environments
# Generate a unique SECRET_KEY for each environment using:
# python -c "import secrets; print(secrets.token_urlsafe(50))"
SECRET_KEY=your-unique-secure-key-for-this-environment
DJANGO_SETTINGS_MODULE=backend.env.dev  # or backend.env.staging/backend.env.prod

# Database
DB_NAME=malog
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Email
EMAIL_SENDER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password

# External APIs
GOOGLE_API_KEY=your-key
SOVTES_LOGIN=your-login
SOVTES_PASSWORD=your-password
API_KEY_OPENAI=your-key
RUPTELA_API_KEY=your-key
```

### Security and Configuration Management

#### Secret Key Management

The `SECRET_KEY` is critical for security:

1. **NEVER commit actual secret keys to version control**
2. **Generate a different secret key for each environment**
3. Keep secret keys in `.env` files which are in `.gitignore`
4. If `SECRET_KEY` is missing in production, the app will fail to start (this is intentional)
5. For development, a temporary key will be generated if none is found in `.env`

#### Database Credentials

Database credentials are handled similarly to SECRET_KEY:

1. Development: Fallbacks are provided for convenience
2. Staging/Production: **No fallbacks** - all database credentials MUST be set in the `.env` file
3. The application will refuse to start in staging/production if any database variables are missing

## Deployment Workflow

### Development

```bash
# Use default .env (set to dev)
python manage.py runserver
```

### Staging Deployment

```bash
# On staging server
cp .env.staging .env
# Edit .env with staging values
export DJANGO_SETTINGS_MODULE=backend.env.staging
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py runserver  # or use gunicorn/uwsgi
```

### Production Deployment

```bash
# On production server
cp .env.production .env
# Edit .env with production values
export DJANGO_SETTINGS_MODULE=backend.env.prod
python manage.py collectstatic --noinput
python manage.py migrate
# Use production WSGI server (gunicorn, uwsgi, etc.)
```

## URL Configuration

The `urls.py` file automatically handles environment-specific behavior:

- **Development**:

  - Serves media files through Django
  - Includes debug toolbar if installed
  - No React app routes

- **Staging/Production**:
  - Serves React app at root path (`/`)
  - API endpoints under `/api/`
  - Catch-all route for React router

## Important Notes

1. **Never commit `.env` files** - they contain secrets
2. **Use the environment-specific files** (`.env.staging`, `.env.production`) as templates for each environment
3. **Database migrations** should be tested in staging before production
4. **Static files** must be collected in staging/production
5. **Nginx configuration** should route properly between SPA and API

## Troubleshooting

### Wrong Settings Module

If you get import errors, check that `DJANGO_SETTINGS_MODULE` is set correctly:

```bash
echo $DJANGO_SETTINGS_MODULE
```

### Database Connection Issues

Verify your database credentials in the `.env` file and ensure the database exists.

### Static Files Not Loading

Run `python manage.py collectstatic` in staging/production environments.

### CORS Issues

Check that your frontend URL is included in the appropriate `CORS_ALLOWED_ORIGINS` setting.
