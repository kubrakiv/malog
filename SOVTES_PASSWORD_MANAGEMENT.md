# Sovtes JWT Authentication - Password Management Guide

## Overview

The Sovtes JWT authentication system provides secure integration between your Malog system and the external Sovtes system. This document explains how password management works for users created through Sovtes JWT authentication.

## Authentication Methods

### 1. JWT-Only Authentication (Recommended)

- **Primary Method**: Users authenticate using JWT tokens from Sovtes
- **Security**: No passwords stored in Malog system
- **Usage**: Standard flow for all Sovtes users

### 2. Temporary Password (Fallback)

- **Purpose**: Emergency access when JWT authentication is unavailable
- **Generation**: Secure 12-character passwords with mixed case, numbers, and symbols
- **Usage**: Admin-managed temporary access

### 3. Password Reset (Emergency)

- **Purpose**: Admin can reset passwords for troubleshooting
- **Security**: New secure passwords generated automatically
- **Logging**: All password operations are logged

## Password Management Features

### Automatic Password Generation

```python
# Secure password generation with:
- 12 characters minimum
- Uppercase letters (A-Z)
- Lowercase letters (a-z)
- Numbers (0-9)
- Special characters (!@#$%^&*)
```

### User Authentication Information

Each Sovtes user has authentication info that shows:

- **Authentication Method**: JWT-only, Password-enabled, or Disabled
- **Password Status**: Has password, No password, or Unusable password
- **Recommendations**: Security guidance for the user
- **Last Login**: When user last authenticated

## API Endpoints

### Authentication Endpoints

```
POST /api/sovtes-auth/login/
POST /api/sovtes-auth/verify/
```

### Admin Management Endpoints (Admin Only)

```
GET  /api/admin/sovtes/users/                    # List all Sovtes users
GET  /api/admin/sovtes/users/{id}/               # Get user details
POST /api/admin/sovtes/users/{id}/reset-password/ # Reset user password
POST /api/admin/sovtes/users/{id}/disable-password/ # Disable password
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

## Security Best Practices

### For Production

1. **JWT Signature Verification**: Configure real RSA public key from Sovtes
2. **Password Policy**: Use JWT-only authentication when possible
3. **Access Control**: Limit admin endpoints to authorized personnel only
4. **Audit Logging**: Monitor password reset operations

### For Development

1. **Test Tokens**: Use provided test token generator
2. **Local Testing**: Signature verification disabled for development
3. **Admin Access**: Use admin credentials for management endpoints

## User Scenarios

### Scenario 1: Normal Operation

1. User receives JWT token from Sovtes
2. User authenticates to Malog with JWT token
3. Malog validates token and creates session
4. User accesses Malog features

### Scenario 2: Emergency Access

1. Admin identifies user needs password access
2. Admin resets password via API or command
3. Admin provides temporary password to user
4. User logs in with username/password
5. Admin disables password when JWT access restored

### Scenario 3: Security Lockdown

1. Admin disables all passwords for Sovtes users
2. Users can only authenticate via JWT tokens
3. Maximum security with no password fallback

## Response Examples

### User Authentication Info

```json
{
  "authentication_method": "JWT-only (Recommended)",
  "has_password": false,
  "password_status": "No password set",
  "recommendation": "User should authenticate using JWT tokens from Sovtes",
  "security_level": "High"
}
```

### Password Reset Response

```json
{
  "message": "Password reset for user sovtes_user_001",
  "username": "sovtes_user_001",
  "temporary_password": "Kp9#mR2vX4nQ",
  "important_note": "This password is for emergency access only. User should authenticate via Sovtes JWT tokens."
}
```

## Troubleshooting

### Common Issues

1. **"User has no password"**

   - Solution: This is normal for JWT-only users
   - Action: User should use JWT token authentication

2. **"Cannot login with username/password"**

   - Solution: Reset password if emergency access needed
   - Command: `python manage.py manage_sovtes_users --reset-password --username <username>`

3. **"Admin endpoints return 401"**

   - Solution: Ensure admin token is valid
   - Action: Login as admin first to get valid token

4. **"JWT token validation fails"**
   - Solution: Check token format and signature
   - Development: Signature verification is disabled
   - Production: Configure proper RSA public key

### Debugging Commands

```bash
# List all Sovtes users and their auth status
python manage.py manage_sovtes_users --list

# Get detailed info for specific user
python manage.py manage_sovtes_users --info --username sovtes_user_001

# Check user's password status
python manage.py shell -c "
from user.models import Profile
user = Profile.objects.get(username='sovtes_user_001')
print(f'Has password: {bool(user.password)}')
print(f'Password usable: {user.has_usable_password()}')
"
```

## Integration Testing

Use the provided Postman collection (`sovtes_jwt_complete_collection.json`) to test:

1. **Authentication Flow**: JWT login and verification
2. **User Management**: List, view, reset, disable operations
3. **Error Handling**: Invalid tokens, unauthorized access
4. **Admin Functions**: Password management endpoints

## Configuration

### Django Settings

```python
# JWT Settings
SIMPLE_JWT = {
    'ALGORITHM': 'RS512',  # RSA signature
    'VERIFY_SIGNATURE': False,  # Disable for development
}

# Sovtes Configuration
SOVTES_JWT_SETTINGS = {
    'VERIFY_SIGNATURE': settings.DEBUG is False,
    'AUDIENCE': 'malog.com',
    'ISSUER': 'sovtes.com',
}
```

### Environment Variables

```bash
# Production
SOVTES_RSA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Development
DEBUG=True  # Disables signature verification
```

## Monitoring and Logging

### Important Log Events

- User creation from JWT tokens
- Password reset operations
- Failed authentication attempts
- Admin management actions

### Metrics to Track

- JWT authentication success rate
- Password reset frequency
- User login patterns
- Security incidents

This comprehensive system ensures secure authentication while providing administrative flexibility for managing Sovtes users in your Malog system.
