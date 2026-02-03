"""
YouScore API Integration Test Script

This script tests the YouScore proxy endpoint to ensure it's working correctly.
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"  # Change to your domain in production
API_KEY = "test_api_key_malog_2025"
CONTRACTOR_CODE = "21509937"


def print_section(title):
    """Print a formatted section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def test_health_check():
    """Test the health check endpoint"""
    print_section("Testing Health Check Endpoint")
    
    try:
        url = f"{BASE_URL}/api/youscore/health"
        print(f"GET {url}")
        
        response = requests.get(url, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check successful!")
            print(json.dumps(data, indent=2))
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False


def test_missing_api_key():
    """Test request without API key"""
    print_section("Testing Missing API Key")
    
    try:
        url = f"{BASE_URL}/api/youscore/vehicles/owned"
        params = {"contractorCode": CONTRACTOR_CODE}
        
        print(f"GET {url}")
        print(f"Query Params: {params}")
        print("Headers: (no API key)")
        
        response = requests.get(url, params=params, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Correctly rejected request without API key")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"❌ Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False


def test_invalid_api_key():
    """Test request with invalid API key"""
    print_section("Testing Invalid API Key")
    
    try:
        url = f"{BASE_URL}/api/youscore/vehicles/owned"
        headers = {"X-API-Key": "invalid_key_12345"}
        params = {"contractorCode": CONTRACTOR_CODE}
        
        print(f"GET {url}")
        print(f"Headers: {headers}")
        print(f"Query Params: {params}")
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Correctly rejected request with invalid API key")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"❌ Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False


def test_missing_contractor_code():
    """Test request without contractorCode parameter"""
    print_section("Testing Missing Contractor Code")
    
    try:
        url = f"{BASE_URL}/api/youscore/vehicles/owned"
        headers = {"X-API-Key": API_KEY}
        
        print(f"GET {url}")
        print(f"Headers: {headers}")
        print("Query Params: (none)")
        
        response = requests.get(url, headers=headers, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Correctly rejected request without contractorCode")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"❌ Expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False


def test_valid_request():
    """Test valid request to fetch vehicles"""
    print_section("Testing Valid Request - Fetching Vehicles")
    
    try:
        url = f"{BASE_URL}/api/youscore/vehicles/owned"
        headers = {"X-API-Key": API_KEY}
        params = {"contractorCode": CONTRACTOR_CODE}
        
        print(f"GET {url}")
        print(f"Headers: {headers}")
        print(f"Query Params: {params}")
        print("\nMaking request to YouScore API...")
        print("This may take a while if there are many vehicles...")
        
        response = requests.get(url, headers=headers, params=params, timeout=120)
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Successfully fetched vehicles!")
            print(f"\nTotal Results: {data.get('totalResults')}")
            print(f"Results Count: {data.get('resultsCount')}")
            print(f"Contractor Code: {data.get('contractorCode')}")
            
            results = data.get('results', [])
            if results:
                print(f"\nFirst vehicle:")
                print(json.dumps(results[0], indent=2))
                
                if len(results) > 1:
                    print(f"\nLast vehicle:")
                    print(json.dumps(results[-1], indent=2))
            
            return True
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(response.text)
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out - YouScore API might be slow or unavailable")
        return False
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False


def test_pagination():
    """Test pagination with custom parameters"""
    print_section("Testing Pagination Parameters")
    
    try:
        url = f"{BASE_URL}/api/youscore/vehicles/owned"
        headers = {"X-API-Key": API_KEY}
        params = {
            "contractorCode": CONTRACTOR_CODE,
            "top": 5,  # Only 5 records per page
            "skip": 0,
            "showCurrentData": "False"
        }
        
        print(f"GET {url}")
        print(f"Headers: {headers}")
        print(f"Query Params: {params}")
        print("\nFetching with pagination (5 records per page)...")
        
        response = requests.get(url, headers=headers, params=params, timeout=120)
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Successfully fetched vehicles with pagination!")
            print(f"\nTotal Results: {data.get('totalResults')}")
            print(f"Results Count: {data.get('resultsCount')}")
            print("\nNote: Even with top=5, all results should be collected")
            return True
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print("  YOUSCORE API INTEGRATION TESTS")
    print("=" * 80)
    print(f"\nBase URL: {BASE_URL}")
    print(f"API Key: {API_KEY}")
    print(f"Contractor Code: {CONTRACTOR_CODE}")
    
    tests = [
        ("Health Check", test_health_check),
        ("Missing API Key", test_missing_api_key),
        ("Invalid API Key", test_invalid_api_key),
        ("Missing Contractor Code", test_missing_contractor_code),
        ("Valid Request", test_valid_request),
        ("Pagination Test", test_pagination),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Test '{test_name}' crashed: {str(e)}")
            results.append((test_name, False))
    
    # Print summary
    print_section("TEST SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
    
    print("=" * 80)


if __name__ == "__main__":
    main()
