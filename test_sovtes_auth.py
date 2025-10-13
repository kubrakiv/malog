"""
Test script for Sovtes JWT Authentication

This script tests the Sovtes JWT authentication functionality.
"""

import requests
import json
from datetime import datetime, timedelta

# Test configuration
BASE_URL = "http://localhost:8000"  # Adjust as needed
SOVTES_LOGIN_URL = f"{BASE_URL}/api/sovtes-auth/login/"
SOVTES_VERIFY_URL = f"{BASE_URL}/api/sovtes-auth/verify/"

# Sample Sovtes JWT token (valid test token)
SAMPLE_TOKEN = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhdXRoIiwiaWF0IjoxNzU5ODU5MjYxLCJleHAiOjE3NTk4OTUyNjEsInVzZXIiOnsiaWQiOjIzODQsImNsaWVudCI6MTgwLCJuYW1lIjoic3VwZXJ1c2VyIiwidXNlcnR5cGUiOjIsInN5c3RlbWxhbmd1YWdlIjoyfX0."


def test_sovtes_token_verification():
    """Test Sovtes token verification endpoint"""
    print("Testing Sovtes Token Verification...")
    
    payload = {"token": SAMPLE_TOKEN}
    
    try:
        response = requests.post(SOVTES_VERIFY_URL, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False


def test_sovtes_login():
    """Test Sovtes JWT login endpoint"""
    print("\nTesting Sovtes JWT Login...")
    
    payload = {"token": SAMPLE_TOKEN}
    
    try:
        response = requests.post(SOVTES_LOGIN_URL, json=payload)
        print(f"Status Code: {response.status_code}")
        response_data = response.json()
        print(f"Response: {json.dumps(response_data, indent=2)}")
        
        if response.status_code == 200:
            # Check if subscription information is included
            if 'subscription' in response_data:
                print("\n✓ Subscription Information Included:")
                subscription = response_data['subscription']
                if subscription:
                    print(f"  Plan: {subscription.get('plan_display_name')}")
                    print(f"  Status: {subscription.get('status')}")
                    print(f"  Truck Limit: {subscription.get('truck_limit')}")
                    print(f"  Billing: {subscription.get('billing_cycle')}")
                else:
                    print("  No active subscription found")
            else:
                print("\n⚠ No subscription information in response")
            
            return response_data.get('access_token'), response_data.get('refresh_token')
        return None, None
    except Exception as e:
        print(f"Error: {e}")
        return None, None


def test_authenticated_request(access_token):
    """Test making an authenticated request with the received token"""
    print("\nTesting Authenticated Request...")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        # Test getting user profile
        response = requests.get(f"{BASE_URL}/api/users/profile/", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("SOVTES JWT AUTHENTICATION TESTS")
    print("=" * 60)
    
    # Test 1: Token Verification
    verify_success = test_sovtes_token_verification()
    
    # Test 2: Login
    access_token, refresh_token = test_sovtes_login()
    login_success = access_token is not None
    
    # Test 3: Authenticated Request (if login succeeded)
    auth_request_success = False
    if login_success:
        auth_request_success = test_authenticated_request(access_token)
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Token Verification: {'PASS' if verify_success else 'FAIL'}")
    print(f"JWT Login:          {'PASS' if login_success else 'FAIL'}")
    print(f"Authenticated Request: {'PASS' if auth_request_success else 'FAIL'}")
    print("=" * 60)
    
    overall_success = verify_success and login_success and auth_request_success
    print(f"Overall Result: {'SUCCESS' if overall_success else 'FAILURE'}")


if __name__ == "__main__":
    main()