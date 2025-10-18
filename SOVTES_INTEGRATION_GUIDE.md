# Sovtes JWT Authentication Implementation Guide

## Overview

This document describes the complete implementation of Sovtes JWT authentication integration with Malog TMS. The system handles user authentication from Sovtes via JWT tokens, automatically creates clients and users, sends welcome emails with credentials, and redirects users to the main application.

## Workflow

### 1. User Flow

```
[Sovtes System] → [User clicks "MALOG TMS"] → [JWT Token Generated] → [Malog Authentication] → [Auto Redirect to /main]
```

### 2. Technical Flow

```
1. User presses "MALOG TMS" button in Sovtes
2. Sovtes generates JWT token with user/client data
3. Sovtes sends POST request to Malog with JWT token
4. Malog validates JWT token
5. Malog checks/creates client based on client_id
6. Malog checks/creates user based on user data
7. Malog generates secure temporary password
8. Malog sends welcome email with credentials
9. Malog generates access/refresh tokens
10. Malog redirects user to /main with auth tokens
```

## API Endpoints

### Authentication Endpoints

#### POST `/api/sovtes-auth/login/`

Main authentication endpoint for JWT token processing.

**Request:**

```json
{
  "jwt_token": "eyJhbGciOiJSUzUxMi..."
}
```

**Response:**

```json
{
  "message": "Login successful",
  "user": {
    "id": 123,
    "username": "sovtes_test_user_002",
    "email": "testuser@sovtes-company.com",
    "first_name": "John",
    "last_name": "Doe",
    "client": {
      "id": 45,
      "name": "Sovtes Test Company Ltd"
    }
  },
  "access": "eyJhbGciOiJIUzI1NiIs...",
  "refresh": "eyJhbGciOiJIUzI1NiIs...",
  "subscription": {
    "plan_name": "base",
    "status": "active",
    "truck_limit": 5
  },
  "redirect_url": "http://localhost:3000/main",
  "user_created": true,
  "sovtes_data": {
    "sovtes_user_id": "test_sovtes_user_002",
    "sovtes_client_id": "sovtes_test_client_002"
  }
}
```

#### POST/GET `/api/sovtes-auth/redirect/`

Direct redirect endpoint for seamless integration.

**GET Request:**

```
/api/sovtes-auth/redirect/?token=eyJhbGciOiJSUzUxMi...
```

**POST Request:**

```json
{
  "jwt_token": "eyJhbGciOiJSUzUxMi..."
}
```

**Response:**

- GET: HTTP 302 redirect to `http://localhost:3000/main?access_token=...&refresh_token=...`
- POST: JSON with redirect_url

### Admin Management Endpoints

#### GET `/api/admin/sovtes/users/`

List all Sovtes users (Admin only)

#### GET `/api/admin/sovtes/users/{id}/`

Get detailed information about a Sovtes user

#### POST `/api/admin/sovtes/users/{id}/reset-password/`

Reset password for a Sovtes user

#### POST `/api/admin/sovtes/users/{id}/disable-password/`

Disable password authentication for a Sovtes user

## JWT Token Structure

### Expected Sovtes JWT Payload

```json
{
  "sub": "user_identifier",
  "client_id": "client_identifier",
  "client_name": "Company Name",
  "email": "user@company.com",
  "first_name": "John",
  "last_name": "Doe",
  "usertype": 1,
  "iat": 1735689600,
  "exp": 1735693200,
  "iss": "sovtes.com",
  "aud": "malog.com"
}
```

### User Type Mapping

- `1`: Driver (regular user)
- `2`: Admin user
- `3`: Logist user

## Client and User Management

### Client Creation

- **Automatic**: Clients are created automatically based on `client_id`
- **Slug**: Generated as `sovtes-{client_id}`
- **Status**: Auto-approved and active
- **Subscription**: Automatically assigned default subscription plan

### User Creation

- **Username**: Generated as `sovtes_{user_identifier}`
- **Email**: From JWT payload or generated placeholder
- **Password**: Secure 16-character temporary password
- **Role**: Mapped from `usertype` field
- **Client**: Associated with created/existing client

## Email Functionality

### Welcome Email Features

- ✅ Secure temporary password generation
- ✅ Clear security instructions
- ✅ Login URL and credentials
- ✅ Professional formatting
- ✅ Database logging
- ✅ Error handling

### Email Template

```
Subject: Welcome to Malog TMS - Login Credentials for {Company Name}

Dear {User Name},

Welcome to Malog TMS! Your account has been successfully created for {Company Name}.

Your login credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Username: sovtes_user_001
📧 Email: user@company.com
🔑 Temporary Password: Kp9#mR2vX4nQ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Login URL: http://localhost:3000/login

IMPORTANT SECURITY NOTES:
🔒 This password is for EMERGENCY ACCESS ONLY
🔑 You should primarily authenticate via your Sovtes JWT token
⚠️  Please keep these credentials secure and do not share them
📝 Store this password safely - you won't receive it again
```

## Password Management

### Three Authentication Methods

1. **JWT-Only (Recommended)**

   - Users authenticate via Sovtes JWT tokens
   - No password stored in Malog
   - Highest security level

2. **JWT + Emergency Password**

   - Secure temporary password available
   - For emergency access when JWT unavailable
   - Medium security level

3. **Password Reset/Disabled**
   - Admin can reset or disable passwords
   - Full control over user access

### Password Security Features

- 16-character secure passwords
- Mixed case letters, numbers, and symbols
- Console and database logging
- Email delivery to user
- Admin management tools

## Integration Examples

### From Sovtes System

#### Method 1: API Integration

```javascript
// Sovtes frontend code
const jwtToken = getJWTTokenFromSovtes();

fetch("http://localhost:8000/api/sovtes-auth/login/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jwt_token: jwtToken,
  }),
})
  .then((response) => response.json())
  .then((data) => {
    if (data.redirect_url) {
      // Redirect user to Malog with auth tokens
      window.location.href = data.redirect_url;
    }
  });
```

#### Method 2: Direct Redirect

```javascript
// Sovtes frontend code
const jwtToken = getJWTTokenFromSovtes();
const redirectUrl = `http://localhost:8000/api/sovtes-auth/redirect/?token=${jwtToken}`;
window.location.href = redirectUrl;
```

### From Malog Frontend

#### Handling Auth Tokens

```javascript
// Check URL parameters for Sovtes authentication
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get("access_token");
const refreshToken = urlParams.get("refresh_token");
const isSovtesAuth = urlParams.get("sovtes_auth");

if (isSovtesAuth && accessToken) {
  // Store tokens
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);

  // Clean URL
  window.history.replaceState({}, document.title, "/main");

  // Initialize authenticated app
  initializeApp();
}
```

## Testing

### Test Script

Run the comprehensive test script:

```bash
cd /d/malog/malog-app
python test_sovtes_auth.py
```

### Manual Testing

#### Test Token Generation

```python
import base64
import json
from datetime import datetime, timedelta

# Generate test token
payload = {
    "sub": "test_user_001",
    "client_id": "test_client_001",
    "client_name": "Test Company",
    "email": "test@company.com",
    "first_name": "Test",
    "last_name": "User",
    "usertype": 1,
    "iat": int(datetime.now().timestamp()),
    "exp": int((datetime.now() + timedelta(hours=1)).timestamp()),
    "iss": "sovtes.com",
    "aud": "malog.com"
}

# Base64URL encode
encoded = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=').decode()
test_token = f"header.{encoded}.signature"
```

#### Test API Calls

```bash
# Test login
curl -X POST http://localhost:8000/api/sovtes-auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"jwt_token": "YOUR_TEST_TOKEN"}'

# Test redirect
curl "http://localhost:8000/api/sovtes-auth/redirect/?token=YOUR_TEST_TOKEN"
```

## Management Commands

### List Sovtes Users

```bash
python manage.py manage_sovtes_users --list
```

### Get User Information

```bash
python manage.py manage_sovtes_users --info --username sovtes_user_001
```

### Reset User Password

```bash
python manage.py manage_sovtes_users --reset-password --username sovtes_user_001
```

### Disable User Password

```bash
python manage.py manage_sovtes_users --disable-password --username sovtes_user_001
```

## Configuration

### Django Settings

```python
# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'

# Frontend URL
FRONTEND_URL = 'http://localhost:3000'

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ALGORITHM': 'HS256',
}
```

### Environment Variables

```bash
# Production RSA public key for JWT verification
SOVTES_RSA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Email credentials
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=https://your-production-domain.com
```

## Security Considerations

### Development vs Production

#### Development

- JWT signature verification disabled
- Console email backend
- Detailed error messages
- Test tokens accepted

#### Production

- JWT signature verification enabled
- SMTP email backend
- Limited error exposure
- Real RSA public key required

### Security Best Practices

1. **JWT Tokens**: Use RS512 with proper signature verification
2. **Passwords**: Generate secure temporary passwords
3. **Email**: Send credentials via secure email
4. **Logging**: Log all authentication events
5. **Access Control**: Admin-only management endpoints
6. **HTTPS**: Use HTTPS in production
7. **Token Expiry**: Short-lived access tokens

## Troubleshooting

### Common Issues

#### "Invalid token structure"

- Check JWT payload format
- Ensure required fields are present
- Verify token encoding

#### "User has no password"

- Normal for JWT-only users
- Use management commands to reset if needed
- Check authentication method in user info

#### "Email not sent"

- Verify SMTP configuration
- Check email credentials
- Review error logs

#### "Client not found"

- Check client_id in JWT token
- Verify client creation logic
- Use management commands to list clients

### Debug Commands

```bash
# Check Django logs
tail -f logs/django.log

# Test email configuration
python manage.py shell -c "
from django.core.mail import send_mail
send_mail('Test', 'Test message', 'from@test.com', ['to@test.com'])
"

# Verify JWT token
python manage.py shell -c "
from base.sovtes_auth import SovtesJWTValidator
token = 'YOUR_TOKEN'
payload = SovtesJWTValidator.validate_token(token)
print(payload)
"
```

## Implementation Files

### Core Files

- `base/sovtes_auth.py` - Authentication logic
- `base/views/sovtes_views.py` - API endpoints
- `base/views/sovtes_redirect_views.py` - Redirect handling
- `base/urls/sovtes_auth_urls.py` - URL routing

### Management Files

- `base/management/commands/manage_sovtes_users.py` - User management
- `base/views/sovtes_user_management_views.py` - Admin endpoints

### Testing Files

- `test_sovtes_auth.py` - Comprehensive test script
- `fixtures/sovtes_jwt_complete_collection.json` - Postman collection

This implementation provides a complete, secure, and scalable solution for Sovtes JWT authentication integration with automatic user provisioning, email notifications, and seamless user experience.
