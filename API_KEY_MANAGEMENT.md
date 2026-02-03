# External API Key Management System

## Overview

The YouScore integration now uses a **database-backed API key system** for secure, manageable authentication. This replaces the hardcoded API key approach with a flexible system that supports:

- ✅ Multiple API keys with individual management
- ✅ Rate limiting per key
- ✅ Endpoint access control
- ✅ IP whitelisting
- ✅ Expiration dates
- ✅ Usage tracking and statistics
- ✅ Easy activation/deactivation

## Database Model

The `ExternalAPIKey` model stores all API key information:

```python
class ExternalAPIKey(models.Model):
    key                 # 64-character unique key (auto-generated)
    name                # Descriptive name
    description         # Optional details
    is_active           # Active/inactive status
    created_at          # Creation timestamp
    updated_at          # Last update timestamp
    expires_at          # Optional expiration date
    last_used_at        # Last usage timestamp
    usage_count         # Total number of uses
    rate_limit          # Requests per hour (0 = unlimited)
    allowed_endpoints   # JSON list of allowed endpoints
    ip_whitelist        # JSON list of allowed IPs
    created_by          # User who created the key
```

## Setup Instructions

### 1. Create Database Migration

```bash
cd d:\malog\malog-app
python manage.py makemigrations base --name add_external_api_key_model
python manage.py migrate
```

### 2. Create Your First API Key

```bash
# Basic API key creation
python manage.py manage_api_keys create "YouScore Integration"

# With all options
python manage.py manage_api_keys create "YouScore API" \
    --description "API key for YouScore vehicle data integration" \
    --rate-limit 1000 \
    --expires-in-days 365 \
    --allowed-endpoints /api/youscore/ \
    --ip-whitelist 192.168.1.100 10.0.0.50
```

Example output:

```
✅ API Key created successfully!

⚠️  IMPORTANT: Save this key securely. You won't be able to see it again!

────────────────────────────────────────────────────────────────────────────────
Name:         YouScore Integration
API Key:      a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
Description:  API key for YouScore vehicle data integration
Rate Limit:   1000 requests/hour
Expires:      2027-01-29 10:30:00
Status:       Active
Created:      2026-01-29 10:30:00
Endpoints:    /api/youscore/
IP Whitelist: 192.168.1.100, 10.0.0.50
────────────────────────────────────────────────────────────────────────────────

📝 Usage Example:
curl -H "X-API-Key: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2" https://yourdomain.com/api/endpoint
```

## Management Commands

### Create API Key

```bash
python manage.py manage_api_keys create "API Key Name" \
    --description "Description" \
    --rate-limit 100 \
    --expires-in-days 365 \
    --allowed-endpoints /api/endpoint1/ /api/endpoint2/ \
    --ip-whitelist 192.168.1.1 10.0.0.1
```

**Options:**

- `--description`: Description of the API key
- `--rate-limit`: Requests per hour (default: 100, use 0 for unlimited)
- `--expires-in-days`: Number of days until expiration (optional)
- `--allowed-endpoints`: Space-separated list of endpoint patterns (optional)
- `--ip-whitelist`: Space-separated list of allowed IPs (optional)

### List All API Keys

```bash
python manage.py manage_api_keys list
```

Output:

```
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
External API Keys
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Name:       YouScore Integration
Key:        a1b2c3d4e5f6g7h8i9j0...e1f2
Status:     ✅ Active
Created:    2026-01-29 10:30
Last Used:  2026-01-29 14:25
Usage:      1523 times
Rate Limit: 1000/hour
Expires:    2027-01-29 10:30
Descr:      API key for YouScore vehicle data integration
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

Total: 1 API keys
```

### Show Detailed Info

```bash
python manage.py manage_api_keys info <api-key>
```

### Deactivate API Key

```bash
python manage.py manage_api_keys deactivate <api-key>
```

### Activate API Key

```bash
python manage.py manage_api_keys activate <api-key>
```

### Delete API Key

```bash
python manage.py manage_api_keys delete <api-key>
```

## Django Admin Interface

Access the API key management through Django admin:

1. Go to: `http://localhost:8000/admin/base/externalapikey/`
2. View all API keys with filtering and search
3. Create, edit, activate/deactivate keys
4. View usage statistics
5. Bulk actions for activation/deactivation

**Admin Features:**

- List view shows: name, status, usage count, last used, created date
- Filter by: is_active, created_at, last_used_at
- Search by: name, description, key
- Bulk actions: activate, deactivate
- Masked key display for security
- Only superusers can delete keys

## Usage in Code

The API key validation is automatic in the YouScore endpoint. The view:

1. **Extracts** the API key from `X-API-Key` header
2. **Validates** the key exists and is active
3. **Checks** expiration date
4. **Verifies** endpoint access permissions
5. **Validates** IP address against whitelist
6. **Enforces** rate limiting
7. **Records** usage statistics

```python
# Example request
curl -X GET "https://test.malog.com.ua/api/youscore/vehicles/owned?contractorCode=21509937" \
  -H "X-API-Key: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
```

## Security Features

### 1. Automatic Key Generation

- 64-character hexadecimal keys (32 bytes)
- Uses Python's `secrets` module for cryptographic randomness
- Guaranteed uniqueness in database

### 2. Key Validation

```python
def is_valid(self):
    # Check if active
    if not self.is_active:
        return False

    # Check expiration
    if self.expires_at and timezone.now() > self.expires_at:
        return False

    return True
```

### 3. Endpoint Access Control

```python
# Restrict key to specific endpoints
allowed_endpoints = ["/api/youscore/", "/api/reports/"]

# Check access
if not api_key_obj.can_access_endpoint(request.path):
    return Response({"error": "Unauthorized endpoint"}, status=403)
```

### 4. IP Whitelisting

```python
# Only allow from specific IPs
ip_whitelist = ["192.168.1.100", "10.0.0.50"]

# Check IP
client_ip = request.META.get('REMOTE_ADDR')
if not api_key_obj.can_access_from_ip(client_ip):
    return Response({"error": "Unauthorized IP"}, status=403)
```

### 5. Rate Limiting

```python
# Set rate limit (requests per hour)
rate_limit = 1000  # 1000 requests per hour

# Check rate limit
if not api_key_obj.check_rate_limit():
    return Response({"error": "Rate limit exceeded"}, status=429)
```

### 6. Usage Tracking

```python
# Automatically tracked on each request
api_key_obj.record_usage()  # Updates last_used_at and usage_count
```

## Error Responses

### 401 - Missing API Key

```json
{
  "error": "Missing API key. Please provide X-API-Key header."
}
```

### 401 - Invalid API Key

```json
{
  "error": "Invalid API key"
}
```

### 401 - Expired/Inactive Key

```json
{
  "error": "Invalid or expired API key"
}
```

### 403 - Unauthorized Endpoint

```json
{
  "error": "This API key is not authorized to access this endpoint"
}
```

### 403 - Unauthorized IP

```json
{
  "error": "This API key cannot be used from your IP address"
}
```

### 429 - Rate Limit Exceeded

```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

## Best Practices

### 1. Key Naming

- Use descriptive names: `"Production Mobile App"`, `"YouScore Integration"`
- Include environment: `"Staging API"`, `"Development Testing"`

### 2. Key Rotation

```bash
# Create new key
python manage.py manage_api_keys create "YouScore Integration v2"

# Test with new key
# ...

# Deactivate old key
python manage.py manage_api_keys deactivate <old-key>

# Delete old key after confirmation period
python manage.py manage_api_keys delete <old-key>
```

### 3. Expiration Management

- Set expiration dates for temporary access
- Review keys regularly: `python manage.py manage_api_keys list`
- Set up alerts for expiring keys

### 4. Access Control

- Use `allowed_endpoints` to restrict access to specific APIs
- Use `ip_whitelist` for services with static IPs
- Keep `rate_limit` reasonable to prevent abuse

### 5. Monitoring

- Check usage statistics regularly in Django admin
- Monitor `last_used_at` to identify unused keys
- Review `usage_count` for anomalies

## Migration from Hardcoded Keys

If you had the hardcoded API key `test_api_key_malog_2025`:

1. **Create equivalent database key:**

```bash
python manage.py manage_api_keys create "Legacy API Key" \
    --description "Migrated from hardcoded test_api_key_malog_2025"
```

2. **Update external clients** with the new key from output

3. **Test** the new key works

4. **Remove** old hardcoded references

## Troubleshooting

### Key not working

```bash
# Check key status
python manage.py manage_api_keys info <api-key>

# Verify it's active and not expired
# Check allowed_endpoints and ip_whitelist settings
```

### Too many rate limit errors

```bash
# Check current rate limit
python manage.py manage_api_keys info <api-key>

# Increase rate limit
# Edit in Django admin or create new key with higher limit
```

### Lost API key

- API keys cannot be retrieved after creation
- Create a new key and update clients
- Deactivate or delete the lost key

## Production Recommendations

1. **Use HTTPS Only**
   - Never send API keys over unencrypted connections

2. **Store Keys Securely**
   - Never commit keys to version control
   - Use environment variables or secrets management

3. **Implement Proper Rate Limiting**
   - Currently placeholder - implement Redis-based rate limiting
   - Track requests per hour per key

4. **Set Up Monitoring**
   - Alert on unusual usage patterns
   - Monitor for brute force attempts
   - Log all API key authentication attempts

5. **Regular Audits**
   - Review active keys monthly
   - Remove unused keys
   - Rotate keys periodically

6. **Documentation**
   - Document which keys are used where
   - Keep contact info for key owners
   - Have a key revocation procedure

## Files Modified/Created

1. **Models:** [base/models.py](base/models.py#L89-L250)
   - Added `ExternalAPIKey` model with full functionality

2. **Views:** [base/views/youscore_views.py](base/views/youscore_views.py#L50-L113)
   - Updated to use database API key validation

3. **Admin:** [base/admin.py](base/admin.py#L296-L354)
   - Added admin interface for API key management

4. **Management Command:** [base/management/commands/manage_api_keys.py](base/management/commands/manage_api_keys.py)
   - CLI tool for API key management

5. **Documentation:**
   - This file: API_KEY_MANAGEMENT.md
   - Updated: YOUSCORE_INTEGRATION_GUIDE.md

## Next Steps

1. **Run migrations:**

   ```bash
   python manage.py makemigrations base --name add_external_api_key_model
   python manage.py migrate
   ```

2. **Create first API key:**

   ```bash
   python manage.py manage_api_keys create "YouScore Integration"
   ```

3. **Update YouScore integration** to use new API key

4. **Implement Redis-based rate limiting** (production)

5. **Set up monitoring and alerts** (production)

## Support

For questions or issues:

- Check Django logs for detailed error messages
- Use `manage_api_keys info` to inspect key settings
- Review admin interface for usage statistics
