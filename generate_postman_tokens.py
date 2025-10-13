"""
Sovtes JWT Test Token Generator for Postman Testing

This script generates valid test tokens with different user scenarios
for testing the Sovtes JWT authentication in Postman.
"""

import jwt
import json
from datetime import datetime, timedelta

def generate_test_token(user_id=2384, client_id=180, user_name="testuser", user_type=2, 
                       system_language=2, hours_valid=24):
    """
    Generate a test Sovtes JWT token
    
    Args:
        user_id (int): Sovtes user ID
        client_id (int): Sovtes client ID  
        user_name (str): User name
        user_type (int): User type (1=driver, 2=admin, 3=logist)
        system_language (int): System language ID
        hours_valid (int): Hours the token should be valid
    
    Returns:
        tuple: (token_string, payload_dict)
    """
    now = datetime.utcnow()
    
    payload = {
        "sub": "auth",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=hours_valid)).timestamp()),
        "user": {
            "id": user_id,
            "client": client_id,
            "name": user_name,
            "usertype": user_type,
            "systemlanguage": system_language
        }
    }
    
    # Create unsigned token for development testing
    token = jwt.encode(payload, "", algorithm="none")
    
    return token, payload

def generate_test_scenarios():
    """Generate multiple test scenarios for comprehensive testing"""
    
    scenarios = [
        {
            "name": "Admin User - Client 180",
            "description": "Standard admin user from Sovtes client 180",
            "params": {
                "user_id": 2384,
                "client_id": 180,
                "user_name": "admin_user",
                "user_type": 2,  # Admin
                "system_language": 2,
                "hours_valid": 24
            }
        },
        {
            "name": "Driver User - Client 180", 
            "description": "Driver user from same client for role testing",
            "params": {
                "user_id": 2385,
                "client_id": 180,
                "user_name": "driver_user",
                "user_type": 1,  # Driver
                "system_language": 2,
                "hours_valid": 24
            }
        },
        {
            "name": "Logist User - Client 200",
            "description": "Logist user from different client",
            "params": {
                "user_id": 3001,
                "client_id": 200,
                "user_name": "logist_user", 
                "user_type": 3,  # Logist
                "system_language": 1,
                "hours_valid": 24
            }
        },
        {
            "name": "New Client - First User",
            "description": "First user from a completely new Sovtes client",
            "params": {
                "user_id": 5000,
                "client_id": 500,
                "user_name": "new_client_admin",
                "user_type": 2,  # Admin
                "system_language": 2,
                "hours_valid": 24
            }
        },
        {
            "name": "Short Expiry Token",
            "description": "Token that expires in 1 hour for expiry testing",
            "params": {
                "user_id": 2384,
                "client_id": 180,
                "user_name": "short_expiry_user",
                "user_type": 2,
                "system_language": 2,
                "hours_valid": 1
            }
        }
    ]
    
    return scenarios

def main():
    """Generate and display test tokens for Postman"""
    
    print("🔐 SOVTES JWT TEST TOKENS FOR POSTMAN")
    print("=" * 80)
    print()
    
    scenarios = generate_test_scenarios()
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"{i}. {scenario['name']}")
        print(f"   Description: {scenario['description']}")
        
        token, payload = generate_test_token(**scenario['params'])
        
        print(f"   Token: {token}")
        print()
        print("   Payload Preview:")
        print(f"   - User ID: {payload['user']['id']}")
        print(f"   - Client ID: {payload['user']['client']}")
        print(f"   - User Type: {payload['user']['usertype']}")
        print(f"   - Expires: {datetime.fromtimestamp(payload['exp'])}")
        print()
        print("-" * 80)
        print()
    
    # Generate a recommended token for basic testing
    print("🌟 RECOMMENDED TOKEN FOR BASIC TESTING:")
    print("=" * 80)
    
    basic_token, basic_payload = generate_test_token(
        user_id=2384,
        client_id=180, 
        user_name="postman_test_user",
        user_type=2,
        system_language=2,
        hours_valid=48  # Valid for 2 days
    )
    
    print(f"Token: {basic_token}")
    print()
    print("📋 Postman Test Details:")
    print(f"- User will be created as: sovtes_2384")
    print(f"- Client will be created as: Sovtes Client 180 (slug: sovtes-180)")
    print(f"- Role: admin")
    print(f"- Subscription: Base Plan (automatically assigned)")
    print(f"- Valid until: {datetime.fromtimestamp(basic_payload['exp'])}")
    print()
    
    # Postman collection snippet
    print("📮 POSTMAN COLLECTION SETUP:")
    print("=" * 80)
    print("""
1. Create a new request in Postman:
   Method: POST
   URL: http://127.0.0.1:8000/api/sovtes-auth/login/

2. Set Headers:
   Content-Type: application/json

3. Set Body (raw JSON):
   {
       "token": "PASTE_TOKEN_HERE"
   }

4. Expected Response:
   - Status: 200 OK
   - Body: User data + access_token + subscription info

5. For subsequent API calls, use the returned access_token:
   Authorization: Bearer YOUR_ACCESS_TOKEN
""")

def generate_postman_environment():
    """Generate Postman environment variables"""
    token, payload = generate_test_token(hours_valid=48)
    
    environment = {
        "name": "Sovtes JWT Testing",
        "values": [
            {
                "key": "sovtes_jwt_token",
                "value": token,
                "enabled": True
            },
            {
                "key": "base_url", 
                "value": "http://127.0.0.1:8000",
                "enabled": True
            },
            {
                "key": "sovtes_auth_login_url",
                "value": "{{base_url}}/api/sovtes-auth/login/",
                "enabled": True
            },
            {
                "key": "sovtes_auth_verify_url", 
                "value": "{{base_url}}/api/sovtes-auth/verify/",
                "enabled": True
            },
            {
                "key": "access_token",
                "value": "",
                "enabled": True
            }
        ]
    }
    
    return environment

if __name__ == "__main__":
    main()
    
    # Also generate Postman environment file
    env = generate_postman_environment()
    
    print("\n📁 POSTMAN ENVIRONMENT FILE:")
    print("=" * 80)
    print("Save this as 'Sovtes_JWT_Testing.postman_environment.json':")
    print()
    print(json.dumps(env, indent=2))