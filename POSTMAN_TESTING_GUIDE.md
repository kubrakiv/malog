# 🧪 Postman Testing Guide for Sovtes JWT Authentication

## 🚀 Quick Start

### Option 1: Import Ready-Made Collection

1. **Import Collection**: Import `Sovtes_JWT_Testing.postman_collection.json` into Postman
2. **Run Tests**: The collection includes 6 pre-configured requests with automated tests
3. **Check Results**: View test results in the Postman Test Results tab

### Option 2: Manual Setup

#### Step 1: Create Environment

1. In Postman, create a new Environment called "Sovtes JWT Testing"
2. Add these variables:

| Variable           | Value                                                                                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base_url`         | `http://127.0.0.1:8000`                                                                                                                                                                                                           |
| `sovtes_jwt_token` | `eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhdXRoIiwiaWF0IjoxNzU5ODYxNDcyLCJleHAiOjE3NjAwMzQyNzIsInVzZXIiOnsiaWQiOjIzODQsImNsaWVudCI6MTgwLCJuYW1lIjoicG9zdG1hbl90ZXN0X3VzZXIiLCJ1c2VydHlwZSI6Miwic3lzdGVtbGFuZ3VhZ2UiOjJ9fQ.` |
| `access_token`     | (leave empty - will be set automatically)                                                                                                                                                                                         |

---

## 🔍 Test Scenarios

### 1. 🔐 JWT Login Test

**Purpose**: Authenticate with Sovtes JWT and get Malog access token

```http
POST {{base_url}}/api/sovtes-auth/login/
Content-Type: application/json

{
    "token": "{{sovtes_jwt_token}}"
}
```

**Expected Response**:

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
  "access_token": "eyJ0eXAiOiJKV1Q...",
  "refresh_token": "eyJ0eXAiOiJKV1Q...",
  "subscription": {
    "plan_name": "base",
    "plan_display_name": "Base Plan",
    "status": "active",
    "truck_limit": 5,
    "billing_cycle": "monthly"
  }
}
```

**✅ Success Indicators**:

- Status: `200 OK`
- Response contains `access_token`
- Response contains `subscription` object
- Client slug starts with `sovtes-`

---

### 2. ✅ Token Verification Test

**Purpose**: Verify JWT token without creating session

```http
POST {{base_url}}/api/sovtes-auth/verify/
Content-Type: application/json

{
    "token": "{{sovtes_jwt_token}}"
}
```

**Expected Response**:

```json
{
  "valid": true,
  "payload": {
    "sub": "auth",
    "user": {
      "id": 2384,
      "client": 180,
      "name": "postman_test_user"
    }
  }
}
```

---

### 3. 👤 Authenticated Profile Test

**Purpose**: Test that Malog JWT token works for API access

```http
GET {{base_url}}/api/users/profile/
Authorization: Bearer {{access_token}}
```

**✅ Success Indicators**:

- Status: `200 OK`
- User belongs to Sovtes client
- Proper role assignment

---

### 4. 📊 Subscription Status Test

**Purpose**: Verify subscription management integration

```http
GET {{base_url}}/api/subscriptions/status/
Authorization: Bearer {{access_token}}
```

**Expected Response**:

```json
{
  "subscription": {
    "plan_name": "base",
    "status": "active",
    "truck_limit": 5
  },
  "current_truck_count": 0,
  "can_add_truck": true
}
```

---

### 5. 🚛 Truck Limit Test

**Purpose**: Test subscription limit enforcement

```http
POST {{base_url}}/api/trucks/
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
    "license_plate": "TEST-001",
    "brand": "Test Brand",
    "model": "Test Model",
    "year": 2024,
    "capacity": 1000
}
```

**Possible Responses**:

**✅ Success (under limit)**:

```json
{
  "id": 123,
  "license_plate": "TEST-001",
  "client": {
    "name": "Sovtes Client 180"
  }
}
```

**❌ Limit Reached**:

```json
{
  "error": "Truck limit reached for current subscription plan",
  "current_count": 5,
  "limit": 5,
  "plan": "Base Plan"
}
```

---

## 🔄 Test Different User Types

### Driver User Token

```
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhdXRoIiwiaWF0IjoxNzU5ODYxNDcyLCJleHAiOjE3NTk5NDc4NzIsInVzZXIiOnsiaWQiOjIzODUsImNsaWVudCI6MTgwLCJuYW1lIjoiZHJpdmVyX3VzZXIiLCJ1c2VydHlwZSI6MSwic3lzdGVtbGFuZ3VhZ2UiOjJ9fQ.
```

- Will create user with "driver" role
- Same client (180)

### Logist User from Different Client

```
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhdXRoIiwiaWF0IjoxNzU5ODYxNDcyLCJleHAiOjE3NTk5NDc4NzIsInVzZXIiOnsiaWQiOjMwMDEsImNsaWVudCI6MjAwLCJuYW1lIjoibG9naXN0X3VzZXIiLCJ1c2VydHlwZSI6Mywic3lzdGVtbGFuZ3VhZ2UiOjF9fQ.
```

- Will create "Sovtes Client 200"
- User gets "logist" role
- Separate subscription and tenant isolation

### New Client Test

```
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhdXRoIiwiaWF0IjoxNzU5ODYxNDcyLCJleHAiOjE3NTk5NDc4NzIsInVzZXIiOnsiaWQiOjUwMDAsImNsaWVudCI6NTAwLCJuYW1lIjoibmV3X2NsaWVudF9hZG1pbiIsInVzZXJ0eXBlIjoyLCJzeXN0ZW1sYW5ndWFnZSI6Mn19.
```

- Will create completely new "Sovtes Client 500"
- Automatic Base Plan subscription assignment
- Tests full new client workflow

---

## 🧪 Advanced Testing Scenarios

### Test Expired Token

Use the 1-hour expiry token after waiting or changing your system clock:

```
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhdXRoIiwiaWF0IjoxNzU5ODYxNDcyLCJleHAiOjE3NTk4NjUwNzIsInVzZXIiOnsiaWQiOjIzODQsImNsaWVudCI6MTgwLCJuYW1lIjoic2hvcnRfZXhwaXJ5X3VzZXIiLCJ1c2VydHlwZSI6Miwic3lzdGVtbGFuZ3VhZ2UiOjJ9fQ.
```

### Test Invalid Token

```json
{
  "token": "invalid.token.here"
}
```

### Test Missing Token

```json
{
  "token": ""
}
```

---

## 📋 Automated Test Scripts

The provided Postman collection includes automated tests that verify:

1. **Response Status Codes**
2. **Token Extraction** (saves access_token automatically)
3. **Subscription Information** (verifies presence and structure)
4. **User Creation** (confirms Sovtes username format)
5. **Client Creation** (confirms slug format)
6. **Tenant Isolation** (ensures data separation)
7. **Subscription Limits** (tests enforcement)

---

## 🚀 Running the Full Test Suite

1. **Import Collection**: `Sovtes_JWT_Testing.postman_collection.json`
2. **Set Environment**: Select "Sovtes JWT Testing" environment
3. **Run Collection**: Use Postman Runner to execute all tests
4. **Check Results**: All tests should pass for successful implementation

The test suite will:

- ✅ Create a new Sovtes client (180)
- ✅ Create a new user (sovtes_2384)
- ✅ Assign Base Plan subscription
- ✅ Test authenticated API access
- ✅ Verify subscription limits
- ✅ Test tenant isolation

---

## 🔧 Troubleshooting

### Connection Refused

- Ensure Django server is running: `python manage.py runserver`
- Check URL: `http://127.0.0.1:8000`

### Token Expired

- Generate new token: `python generate_postman_tokens.py`
- Update environment variable

### Subscription Not Created

- Check logs: Look for subscription assignment errors
- Run: `python manage.py manage_sovtes_subscriptions --action assign-default`

### User/Client Already Exists

- Different tokens create different users
- Use management commands to clean up test data if needed
