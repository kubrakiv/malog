# Sovtes JWT Authentication Implementation

## Overview

This document describes the implementation of JWT authentication for the external "Sovtes" system in the Malog application.

## Implementation Details

### Files Created/Modified

1. **`base/sovtes_auth.py`** - Core JWT validation and user management logic
2. **`base/views/sovtes_views.py`** - API endpoints for Sovtes authentication
3. **`base/urls/sovtes_auth_urls.py`** - URL routing for Sovtes endpoints
4. **`backend/urls.py`** - Added Sovtes auth URL pattern
5. **`base/management/commands/decode_sovtes_token.py`** - Management command for token analysis

### Core Components

#### SovtesJWTValidator

- Validates Sovtes JWT tokens (RS512 algorithm)
- Currently configured for development (signature verification disabled)
- Validates token structure and expiration

#### SovtesUserManager

- Handles client and user creation/retrieval
- Maps Sovtes user types to Malog roles
- Creates clients with `sovtes-{client_id}` naming convention

### API Endpoints

#### POST `/api/sovtes-auth/login/`

**Purpose**: Authenticate with Sovtes JWT token and receive Malog JWT tokens

**Request Body**:

```json
{
  "token": "sovtes_jwt_token_here"
}
```

**Response** (Success):

```json
{
  "message": "Login successful",
  "user": {
    "id": 123,
    "username": "sovtes_2384",
    "email": "sovtes_2384@sovtes-system.com",
    "client": {
      "id": 456,
      "name": "Sovtes Client 180",
      "slug": "sovtes-180"
    }
  },
  "access_token": "malog_jwt_access_token",
  "refresh_token": "malog_jwt_refresh_token",
  "sovtes_data": {
    "sovtes_user_id": 2384,
    "sovtes_client_id": 180,
    "user_type": 2,
    "system_language": 2
  }
}
```

#### POST `/api/sovtes-auth/verify/`

**Purpose**: Verify Sovtes JWT token without creating session

**Request Body**:

```json
{
  "token": "sovtes_jwt_token_here"
}
```

**Response** (Valid Token):

```json
{
  "valid": true,
  "payload": {
    "sub": "auth",
    "iat": 1759859261,
    "exp": 1759895261,
    "user": {
      "id": 2384,
      "client": 180,
      "name": "superuser",
      "usertype": 2,
      "systemlanguage": 2
    }
  },
  "message": "Token is valid"
}
```

### Authentication Flow

1. **Sovtes System** sends JWT token to `/api/sovtes-auth/login/`
2. **Token Validation**:
   - Decode JWT token
   - Verify structure and expiration
   - Extract user and client information
3. **Client Management**:
   - Check if client exists (by `sovtes-{client_id}` slug)
   - Create client if not exists (auto-approved)
4. **User Management**:
   - Check if user exists (by `sovtes_{user_id}` username)
   - Create user if not exists
   - Map user type to appropriate role
5. **Session Creation**:
   - Generate Malog JWT tokens
   - Return user data and tokens

### User Type Mapping

| Sovtes UserType | Malog Role |
| --------------- | ---------- |
| 1               | driver     |
| 2               | admin      |
| 3               | logist     |

### Security Considerations

#### Development Configuration

- Signature verification is disabled (`SKIP_SIGNATURE_VERIFICATION = True`)
- Uses placeholder public key

#### Production Configuration

- Must provide actual Sovtes RSA public key
- Enable signature verification (`SKIP_SIGNATURE_VERIFICATION = False`)
- Store public key securely (environment variables recommended)

### Testing

#### Management Command

```bash
python manage.py decode_sovtes_token "jwt_token_here" [--validate]
```

#### Test Script

```bash
python test_sovtes_auth.py
```

### Example JWT Token Structure

**Header**:

```json
{
  "typ": "JWT",
  "alg": "RS512"
}
```

**Payload**:

```json
{
  "sub": "auth",
  "iat": 1759859261,
  "exp": 1759895261,
  "user": {
    "id": 2384,
    "client": 180,
    "name": "superuser",
    "usertype": 2,
    "systemlanguage": 2
  }
}
```

### Integration Notes

1. **Existing Authentication**: The implementation works alongside existing Malog JWT authentication
2. **Client Isolation**: Sovtes clients are properly isolated using the tenant system
3. **Role Mapping**: Sovtes users are automatically assigned appropriate roles
4. **Auto-Approval**: Sovtes clients are automatically approved (no manual admin approval required)

### Subscription Management Integration

#### Automatic Subscription Assignment

- **New Sovtes clients** automatically receive a **Base Plan** subscription
- **Status**: Active (immediate access, no approval required)
- **Billing**: Monthly (30-day cycles)
- **Truck Limits**: Enforced according to subscription plan

#### Subscription Information in JWT Response

The login response now includes complete subscription details:

```json
{
    "message": "Login successful",
    "user": { ... },
    "access_token": "...",
    "refresh_token": "...",
    "subscription": {
        "plan_name": "base",
        "plan_display_name": "Base Plan",
        "billing_cycle": "monthly",
        "status": "active",
        "start_date": "2025-10-07T23:47:41",
        "end_date": "2025-11-06T23:47:41",
        "truck_limit": 5,
        "features": ["basic_tracking", "reports"],
        "auto_renew": true,
        "is_trial": false
    },
    "sovtes_data": { ... }
}
```

#### Management Commands

**List Sovtes Subscriptions**:

```bash
# List all Sovtes client subscriptions
python manage.py manage_sovtes_subscriptions --action list

# List specific client
python manage.py manage_sovtes_subscriptions --action list --client-id 180
```

**Assign Default Subscriptions**:

```bash
# Assign base plan to Sovtes clients without subscriptions
python manage.py manage_sovtes_subscriptions --action assign-default [--dry-run]
```

**Upgrade Subscription**:

```bash
# Upgrade specific client to pro plan
python manage.py manage_sovtes_subscriptions --action upgrade --client-id 180 --plan pro [--dry-run]
```

**Extend Subscription**:

```bash
# Extend subscription by 30 days
python manage.py manage_sovtes_subscriptions --action extend --client-id 180 --days 30 [--dry-run]
```

#### Subscription Limits Enforcement

- **Truck Creation**: Automatically enforced based on subscription plan
- **Feature Access**: Controlled through subscription plan features
- **API Responses**: Include current usage vs. limits

### Future Enhancements

1. **Public Key Management**: Implement secure public key storage and rotation
2. **Advanced User Mapping**: More sophisticated user type to role mapping
3. **Audit Logging**: Log all Sovtes authentication attempts
4. **Token Blacklisting**: Implement token revocation mechanism
5. **Rate Limiting**: Add rate limiting for authentication endpoints
6. **Subscription Webhooks**: Notify Sovtes of subscription changes
7. **Usage Analytics**: Track feature usage per Sovtes client

## Usage Example

```python
import requests

# Sovtes login
response = requests.post('http://your-malog-server/api/sovtes-auth/login/',
                        json={'token': 'your_sovtes_jwt_token'})

if response.status_code == 200:
    data = response.json()
    access_token = data['access_token']

    # Use access token for subsequent API calls
    headers = {'Authorization': f'Bearer {access_token}'}
    user_response = requests.get('http://your-malog-server/api/users/profile/',
                                headers=headers)
```
