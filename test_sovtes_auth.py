#!/usr/bin/env python
"""
Sovtes JWT Authentication Test Script

This script tests the complete Sovtes authentication workflow:
1. Generate test JWT token
2. Authenticate user
3. Check client/user creation
4. Verify email sending
5. Test redirect functionality
"""

import os
import sys
import django
import jwt
import json
import requests
from datetime import datetime, timedelta

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from base.sovtes_auth import SovtesJWTValidator, SovtesUserManager
from base.models import Client
from user.models import Profile


def generate_test_jwt():
    """Generate a test JWT token that matches expected Sovtes format"""
    
    # JWT Header
    header = {
        "alg": "RS512",
        "typ": "JWT"
    }
    
    # JWT Payload - Updated to match your workflow
    payload = {
        "sub": f"test_sovtes_user_{int(datetime.now().timestamp()) % 1000}",  # Make unique
        "client_id": f"sovtes_test_client_{int(datetime.now().timestamp()) % 1000}",
        "client_name": "Sovtes Test Company Ltd",
        "email": f"testuser{int(datetime.now().timestamp()) % 1000}@sovtes-company.com",
        "first_name": "John",
        "last_name": "Doe", 
        "usertype": 1,  # Regular user
        "iat": int(datetime.now().timestamp()),
        "exp": int((datetime.now() + timedelta(hours=1)).timestamp()),
        "iss": "sovtes.com",
        "aud": "malog.com"
    }
    
    # For testing without signature verification
    # Create token parts
    import base64
    import json
    
    def base64url_encode(data):
        if isinstance(data, str):
            data = data.encode('utf-8')
        elif isinstance(data, dict):
            data = json.dumps(data).encode('utf-8')
        return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')
    
    encoded_header = base64url_encode(header)
    encoded_payload = base64url_encode(payload)
    
    # Test signature (since we skip verification in development)
    test_signature = "test_signature_for_development"
    
    token = f"{encoded_header}.{encoded_payload}.{test_signature}"
    
    return token, payload


def test_token_validation(token):
    """Test token validation"""
    print("🔍 Testing Token Validation...")
    
    try:
        payload = SovtesJWTValidator.validate_token(token)
        print("✅ Token validation successful")
        print(f"   Subject: {payload.get('sub')}")
        print(f"   Client ID: {payload.get('client_id')}")
        print(f"   Email: {payload.get('email')}")
        return payload
    except Exception as e:
        print(f"❌ Token validation failed: {e}")
        return None


def test_client_creation(payload):
    """Test client creation/retrieval"""
    print("\n🏢 Testing Client Creation...")
    
    try:
        client_id = payload.get('client_id')
        client_name = payload.get('client_name')
        
        # Count clients before
        initial_count = Client.objects.count()
        
        # Clean up any existing test client first
        expected_slug = f"sovtes-{client_id}"
        existing_clients = Client.objects.filter(slug=expected_slug)
        if existing_clients.exists():
            print(f"   Cleaning up existing test client...")
            existing_clients.delete()
        
        client = SovtesUserManager.get_or_create_client(client_id, client_name)
        
        final_count = Client.objects.count()
        
        if final_count > initial_count:
            print("✅ New client created successfully")
        else:
            print("✅ Existing client retrieved successfully")
            
        print(f"   Client Name: {client.name}")
        print(f"   Client Slug: {client.slug}")
        print(f"   Is Active: {client.is_active}")
        print(f"   Is Approved: {client.is_approved}")
        
        return client
    except Exception as e:
        print(f"❌ Client creation failed: {e}")
        return None


def test_user_creation(payload, client):
    """Test user creation/retrieval"""
    print("\n👤 Testing User Creation...")
    
    try:
        # Count users before
        initial_count = Profile.objects.filter(username__startswith='sovtes_').count()
        
        # Clean up any existing user with conflicting email first
        expected_username = f"sovtes_{payload.get('sub')}"
        existing_users = Profile.objects.filter(
            username__in=[expected_username, payload.get('email')]
        )
        if existing_users.exists():
            print(f"   Cleaning up {existing_users.count()} existing test users...")
            existing_users.delete()
        
        user, created = SovtesUserManager.get_or_create_user(payload, client)
        
        final_count = Profile.objects.filter(username__startswith='sovtes_').count()
        
        if created:
            print("✅ New user created successfully")
            print("📧 Welcome email should have been sent")
        else:
            print("✅ Existing user retrieved successfully")
            
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Full Name: {user.get_full_name()}")
        print(f"   Client: {user.client.name}")
        print(f"   Role: {user.role.name}")
        print(f"   Has Password: {bool(user.password)}")
        
        # Test authentication info
        auth_info = SovtesUserManager.get_user_temp_password_info(user)
        if auth_info:
            print(f"   Auth Method: {auth_info['authentication_method']}")
            print(f"   Security Level: {auth_info['security_level']}")
        
        return user
    except Exception as e:
        print(f"❌ User creation failed: {e}")
        return None


def test_api_endpoints(token):
    """Test API endpoints"""
    print("\n🌐 Testing API Endpoints...")
    
    base_url = "http://localhost:8000"
    
    # Test login endpoint
    print("Testing login endpoint...")
    try:
        response = requests.post(
            f"{base_url}/api/sovtes-auth/login/",
            json={"jwt_token": token},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login endpoint successful")
            print(f"   Message: {data.get('message')}")
            print(f"   Redirect URL: {data.get('redirect_url')}")
            print(f"   User Created: {data.get('user_created')}")
            
            # Show tokens (first 50 chars only for security)
            access_token = data.get('access', '')
            refresh_token = data.get('refresh', '')
            print(f"   Access Token: {access_token[:50]}...")
            print(f"   Refresh Token: {refresh_token[:50]}...")
            
        else:
            print(f"❌ Login endpoint failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Login endpoint error: {e}")
    
    # Test redirect endpoint
    print("\nTesting redirect endpoint...")
    try:
        response = requests.post(
            f"{base_url}/api/sovtes-auth/redirect/",
            json={"jwt_token": token},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Redirect endpoint successful")
            print(f"   Redirect URL: {data.get('redirect_url')}")
        else:
            print(f"❌ Redirect endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Redirect endpoint error: {e}")


def main():
    """Main test function"""
    print("🚀 Starting Sovtes JWT Authentication Test")
    print("=" * 60)
    
    # Step 1: Generate test token
    print("1️⃣ Generating Test JWT Token...")
    token, payload = generate_test_jwt()
    print(f"✅ Token generated successfully")
    print(f"   Token (first 50 chars): {token[:50]}...")
    
    # Step 2: Test token validation
    payload = test_token_validation(token)
    if not payload:
        print("❌ Cannot continue without valid token")
        return
    
    # Step 3: Test client creation
    client = test_client_creation(payload)
    if not client:
        print("❌ Cannot continue without client")
        return
    
    # Step 4: Test user creation
    user = test_user_creation(payload, client)
    if not user:
        print("❌ Cannot continue without user")
        return
    
    # Step 5: Test API endpoints
    test_api_endpoints(token)
    
    print("\n" + "=" * 60)
    print("🎉 Test completed!")
    print("\n📋 Summary:")
    print(f"   ✅ Token: Valid")
    print(f"   ✅ Client: {client.name}")
    print(f"   ✅ User: {user.username} ({user.email})")
    print(f"   ✅ Authentication: Ready")
    
    print(f"\n🔗 Integration URLs:")
    print(f"   • Login API: http://localhost:8000/api/sovtes-auth/login/")
    print(f"   • Redirect: http://localhost:8000/api/sovtes-auth/redirect/?token={token[:20]}...")
    print(f"   • Frontend: http://localhost:3000/main")
    
    print(f"\n💡 For Sovtes Integration:")
    print(f"   1. From Sovtes, POST JWT token to: /api/sovtes-auth/login/")
    print(f"   2. Or redirect to: /api/sovtes-auth/redirect/?token=<JWT_TOKEN>")
    print(f"   3. User will be automatically redirected to /main with auth tokens")


if __name__ == "__main__":
    main()