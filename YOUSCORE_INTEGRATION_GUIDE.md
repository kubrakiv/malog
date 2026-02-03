# YouScore API Integration Guide

## Overview

This integration provides a secure proxy endpoint to fetch vehicle data from the YouScore API. The endpoint handles authentication, pagination, and data aggregation automatically.

## Features

- ✅ **Database-backed API Key authentication** for external access
- ✅ Rate limiting and access control per key
- ✅ Automatic pagination handling
- ✅ Collects all vehicle records (handles totalResults)
- ✅ Secure token management
- ✅ Error handling and logging
- ✅ Health check endpoint
- ✅ Usage tracking and statistics

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# YouScore API Token (Bearer token)
YOUSCORE_API_TOKEN=f95c0000d8dfa560d738e552db034d993a822fd4
```

### Database Setup

1. **Run migrations:**

```bash
python manage.py makemigrations base --name add_external_api_key_model
python manage.py migrate
```

2. **Create an API key:**

```bash
python manage.py manage_api_keys create "YouScore Integration" \
    --description "API key for YouScore vehicle data integration" \
    --rate-limit 1000 \
    --expires-in-days 365
```

3. **Save the generated API key** - you won't be able to see it again!

### API Key Management

The system now uses **database-backed API keys** instead of hardcoded values. This provides:

- Individual key management
- Rate limiting per key
- Endpoint access control
- IP whitelisting
- Expiration dates
- Usage tracking

For full API key management documentation, see [API_KEY_MANAGEMENT.md](API_KEY_MANAGEMENT.md).

Quick commands:

```bash
# List all keys
python manage.py manage_api_keys list

# View key details
python manage.py manage_api_keys info <api-key>

# Deactivate a key
python manage.py manage_api_keys deactivate <api-key>

# Activate a key
python manage.py manage_api_keys activate <api-key>
```

## API Endpoints

### 1. Get Vehicles Owned

**Endpoint:** `GET https://test.malog.com.ua/api/youscore/vehicles/owned`

**Description:** Fetches all vehicles owned by a contractor from YouScore API.

#### Headers

| Header    | Value                      | Required | Description                                                        |
| --------- | -------------------------- | -------- | ------------------------------------------------------------------ |
| X-API-Key | `<your-generated-api-key>` | Yes      | API key for authentication (generated via manage_api_keys command) |

#### Query Parameters

| Parameter       | Type    | Required | Default | Description                     |
| --------------- | ------- | -------- | ------- | ------------------------------- |
| contractorCode  | string  | Yes      | -       | Company code (e.g., "21509937") |
| top             | integer | No       | 100     | Number of results per page      |
| skip            | integer | No       | 0       | Number of results to skip       |
| showCurrentData | boolean | No       | False   | Flag to show current data       |

#### Example Request

```bash
curl -X GET "https://test.malog.com.ua/api/youscore/vehicles/owned?contractorCode=21509937" \
  -H "X-API-Key: <your-generated-api-key>"
```

**Note:** Replace `<your-generated-api-key>` with the actual API key generated from the `manage_api_keys` command.

#### Example Response

```json
{
  "totalResults": 150,
  "resultsCount": 150,
  "contractorCode": "21509937",
  "results": [
    {
      "operationCode": 329,
      "operationName": "ПЕРЕРЕЄСТРАЦІЯ ТЗ НА НОВОГО ВЛАСНИКА ЗА ДОГОВОРОМ ФІНАНСОВОГО ЛІЗИНГУ ТА ДКП ПРЕДМЕТА ЛІЗИНГУ",
      "registrationDepartmentName": "ТСЦ 8046",
      "type": "ВАНТАЖНИЙ",
      "model": "R400",
      "brand": "SCANIA",
      "bodyType": "СІДЛОВИЙ ТЯГАЧ",
      "fuelType": "ДИЗЕЛЬНЕ ПАЛИВО",
      "color": "БІЛИЙ",
      "makeYear": 2016,
      "engineCapacity": 12740,
      "ownWeight": 7940.0,
      "totalWeight": 19000.0,
      "lastRegistrationDate": "2021-06-01T00:00:00+03:00",
      "purpose": "СПЕЦІАЛІЗОВАНИЙ"
    }
    // ... 149 more vehicles
  ]
}
```

### 2. Health Check

**Endpoint:** `GET https://test.malog.com.ua/api/youscore/health`

**Description:** Check if the YouScore proxy service is operational.

#### Example Request

```bash
curl -X GET "https://test.malog.com.ua/api/youscore/health"
```

#### Example Response

```json
{
  "status": "ok",
  "service": "YouScore Proxy API",
  "endpoint": "https://api.youscore.com.ua/v1/vehicles/owned",
  "documentation": {
    "usage": "GET /api/youscore/vehicles/owned?contractorCode=XXX",
    "authentication": "Include X-API-Key header with your API key",
    "parameters": {
      "contractorCode": "Company code (required)",
      "top": "Results per page (optional, default: 100)",
      "skip": "Results to skip (optional, default: 0)",
      "showCurrentData": "Boolean flag (optional, default: False)"
    }
  }
}
```

## How It Works

1. **Authentication:** The endpoint validates the `X-API-Key` header against the expected API key.

2. **Forwarding Request:** The request is forwarded to YouScore API with the Bearer token:

   ```
   Authorization: Bearer f95c0000d8dfa560d738e552db034d993a822fd4
   ```

3. **Pagination Handling:** The endpoint automatically:
   - Fetches results page by page (100 records per page by default)
   - Continues until all `totalResults` are collected
   - Has a safety limit of 100 pages (10,000 records)

4. **Response:** Returns all collected vehicle data in a single response.

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Missing API key. Please provide X-API-Key header."
}
```

or

```json
{
  "error": "Invalid API key"
}
```

### 400 Bad Request

```json
{
  "error": "contractorCode is required"
}
```

### 500 Internal Server Error

```json
{
  "error": "Server misconfigured: missing YouScore API credentials"
}
```

### 502 Bad Gateway

```json
{
  "error": "Failed to connect to YouScore API: Connection timeout"
}
```

### 504 Gateway Timeout

```json
{
  "error": "Request to YouScore API timed out"
}
```

## Testing

### Using cURL

```bash
# Basic test
curl -X GET "http://localhost:8000/api/youscore/vehicles/owned?contractorCode=21509937" \
  -H "X-API-Key: test_api_key_malog_2025"

# With pagination parameters
curl -X GET "http://localhost:8000/api/youscore/vehicles/owned?contractorCode=21509937&top=50&skip=0&showCurrentData=False" \
  -H "X-API-Key: test_api_key_malog_2025"

# Health check
curl -X GET "http://localhost:8000/api/youscore/health"
```

### Using Postman

1. **Create a new GET request**
2. **URL:** `https://test.malog.com.ua/api/youscore/vehicles/owned`
3. **Headers:**
   - Key: `X-API-Key`
   - Value: `test_api_key_malog_2025`
4. **Query Parameters:**
   - `contractorCode`: `21509937`
5. **Send the request**

### Using Python

```python
import requests

url = "https://test.malog.com.ua/api/youscore/vehicles/owned"
headers = {
    "X-API-Key": "test_api_key_malog_2025"
}
params = {
    "contractorCode": "21509937"
}

response = requests.get(url, headers=headers, params=params)
data = response.json()

print(f"Total vehicles: {data['totalResults']}")
print(f"Collected: {data['resultsCount']}")
print(f"First vehicle: {data['results'][0]}")
```

### Using JavaScript (Fetch API)

```javascript
const url =
  "https://test.malog.com.ua/api/youscore/vehicles/owned?contractorCode=21509937";
const headers = {
  "X-API-Key": "test_api_key_malog_2025",
};

fetch(url, { headers })
  .then((response) => response.json())
  .then((data) => {
    console.log("Total vehicles:", data.totalResults);
    console.log("Collected:", data.resultsCount);
    console.log("Vehicles:", data.results);
  })
  .catch((error) => console.error("Error:", error));
```

## Security Considerations

### Current Implementation

- ✅ Bearer token stored in environment variable
- ✅ API key validation
- ⚠️ API key is hardcoded (should be in database)
- ⚠️ No rate limiting
- ⚠️ No API key rotation mechanism

### Recommended Production Security

1. **API Key Management:**

   ```python
   # Store API keys in database with metadata
   class APIKey(models.Model):
       key = models.CharField(max_length=64, unique=True)
       name = models.CharField(max_length=255)
       created_at = models.DateTimeField(auto_now_add=True)
       expires_at = models.DateTimeField(null=True)
       is_active = models.BooleanField(default=True)
       rate_limit = models.IntegerField(default=100)  # requests per hour
   ```

2. **Rate Limiting:**

   ```python
   from rest_framework.throttling import AnonRateThrottle

   class APIKeyRateThrottle(AnonRateThrottle):
       rate = '100/hour'
   ```

3. **IP Whitelisting:**

   ```python
   ALLOWED_IPS = ['192.168.1.1', '10.0.0.1']

   if request.META.get('REMOTE_ADDR') not in ALLOWED_IPS:
       return Response({"error": "IP not allowed"}, status=403)
   ```

4. **HTTPS Only:**

   ```python
   # In settings.py
   SECURE_SSL_REDIRECT = True
   SESSION_COOKIE_SECURE = True
   CSRF_COOKIE_SECURE = True
   ```

5. **Logging and Monitoring:**
   ```python
   logger.info(f"API request from {request.META.get('REMOTE_ADDR')} "
               f"with key {api_key[:10]}... "
               f"for contractor {contractor_code}")
   ```

## Files Created

1. **Views:** [base/views/youscore_views.py](base/views/youscore_views.py)
   - Contains the main proxy logic
   - Handles authentication and pagination

2. **URLs:** [base/urls/youscore_urls.py](base/urls/youscore_urls.py)
   - URL routing configuration

3. **Configuration:** [base/entry_data.py](base/entry_data.py)
   - YouScore API token storage

4. **Main URLs:** [backend/urls.py](backend/urls.py)
   - Registered `/api/youscore/` endpoint

## Troubleshooting

### Issue: "Invalid API key"

**Solution:** Ensure you're sending the correct API key in the `X-API-Key` header.

### Issue: "contractorCode is required"

**Solution:** Add the `contractorCode` query parameter to your request.

### Issue: "YouScore API returned error: 401"

**Solution:** Check if the YouScore Bearer token in `.env` is correct and not expired.

### Issue: "Request to YouScore API timed out"

**Solution:**

- Check your internet connection
- Verify YouScore API is accessible
- Increase timeout in the code if needed

### Issue: Empty results

**Solution:**

- Verify the `contractorCode` is correct
- Check if the contractor has any vehicles in YouScore system
- Try with `showCurrentData=True`

## Logging

The endpoint logs all operations. Check Django logs for debugging:

```bash
# View logs in real-time
tail -f logs/django.log

# Search for YouScore-specific logs
grep "YouScore" logs/django.log
```

Log levels:

- **INFO:** Successful operations
- **DEBUG:** Detailed pagination info
- **WARNING:** Invalid API keys
- **ERROR:** API failures

## Next Steps

1. **Implement Database-Based API Keys:**
   - Create APIKey model
   - Add management endpoints
   - Implement key rotation

2. **Add Rate Limiting:**
   - Track requests per API key
   - Implement throttling

3. **Enhanced Security:**
   - Add IP whitelisting
   - Implement request signing
   - Add audit logging

4. **Performance:**
   - Add caching for frequently requested data
   - Implement async requests for pagination
   - Add database storage for historical data

5. **Monitoring:**
   - Add metrics collection
   - Implement alerting
   - Create dashboard for API usage

## Support

For issues or questions, contact the development team or check the Django admin logs.
