# YouScore API - Quick Reference

## � Setup (One-Time)

```bash
# 1. Run migrations
python manage.py makemigrations base --name add_external_api_key_model
python manage.py migrate

# 2. Create API key
python manage.py manage_api_keys create "YouScore Integration"

# 3. Save the generated key!
```

---

## 🚀 Quick Start

### Endpoint

```
GET https://test.malog.com.ua/api/youscore/vehicles/owned
```

### Required Headers

```
X-API-Key: <your-generated-api-key>
```

### Required Parameters

```
contractorCode=21509937
```

---

## 📋 Full Example

### cURL

```bash
curl -X GET "https://test.malog.com.ua/api/youscore/vehicles/owned?contractorCode=21509937" \
  -H "X-API-Key: <your-generated-api-key>"
```

### Python

```python
import requests

response = requests.get(
    "https://test.malog.com.ua/api/youscore/vehicles/owned",
    headers={"X-API-Key": "<your-generated-api-key>"},
    params={"contractorCode": "21509937"}
)
data = response.json()
print(f"Total vehicles: {data['totalResults']}")
```

### JavaScript

```javascript
fetch(
  "https://test.malog.com.ua/api/youscore/vehicles/owned?contractorCode=21509937",
  {
    headers: { "X-API-Key": "<your-generated-api-key>" },
  },
)
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## 📝 Response Format

```json
{
  "totalResults": 150,
  "resultsCount": 150,
  "contractorCode": "21509937",
  "results": [
    {
      "operationCode": 329,
      "operationName": "...",
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
  ]
}
```

---

## 🎯 Key Features

✅ **Automatic Pagination** - Fetches ALL results automatically  
✅ **Simple API Key Auth** - Just add X-API-Key header  
✅ **Complete Data** - Returns all vehicle records  
✅ **Error Handling** - Clear error messages

---

## 🔧 Optional Parameters

| Parameter         | Type | Default | Description            |
| ----------------- | ---- | ------- | ---------------------- |
| `top`             | int  | 100     | Records per page       |
| `skip`            | int  | 0       | Records to skip        |
| `showCurrentData` | bool | False   | Show current data only |

---

## ⚡ Health Check

```bash
curl https://test.malog.com.ua/api/youscore/health
```

---

## 🐛 Common Errors

### 401 - Missing/Invalid API Key

```json
{ "error": "Invalid API key" }
```

**Fix:** Check X-API-Key header

### 400 - Missing Contractor Code

```json
{ "error": "contractorCode is required" }
```

**Fix:** Add ?contractorCode=XXX parameter

---

## 📞 Testing

Run the test script:

```bash
python test_youscore_integration.py
```

---

## � API Key Management

```bash
# List all keys
python manage.py manage_api_keys list

# View key details
python manage.py manage_api_keys info <api-key>

# Create new key
python manage.py manage_api_keys create "My API Key"

# Deactivate key
python manage.py manage_api_keys deactivate <api-key>

# Activate key
python manage.py manage_api_keys activate <api-key>

# Delete key
python manage.py manage_api_keys delete <api-key>
```

---

## 📚 Full Documentation

- **Setup Guide:** [API_KEY_MANAGEMENT.md](API_KEY_MANAGEMENT.md)
- **Integration Guide:** [YOUSCORE_INTEGRATION_GUIDE.md](YOUSCORE_INTEGRATION_GUIDE.md)
- **Implementation:** [API_KEY_IMPLEMENTATION_SUMMARY.md](API_KEY_IMPLEMENTATION_SUMMARY.md)
