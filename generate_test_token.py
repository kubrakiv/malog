"""
Generate test Sovtes JWT tokens for development

This script creates valid test tokens for development and testing purposes.
"""

import jwt
import json
from datetime import datetime, timedelta

def generate_test_sovtes_token():
    """Generate a test Sovtes JWT token for development"""
    
    # Current time
    now = datetime.utcnow()
    
    # Token payload similar to the Sovtes format
    payload = {
        "sub": "auth",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=10)).timestamp()),  # Valid for 10 hours
        "user": {
            "id": 2384,
            "client": 180,
            "name": "superuser",
            "usertype": 2,
            "systemlanguage": 2
        }
    }
    
    # For development, we'll create an unsigned token (no signature verification)
    # In production, this would be signed with Sovtes' private key
    token = jwt.encode(payload, "", algorithm="none")
    
    # Remove the signature part for testing (since we skip verification)
    # This creates a token that looks like: header.payload.
    token_parts = token.split('.')
    if len(token_parts) == 3:
        # Create token without signature for testing
        test_token = f"{token_parts[0]}.{token_parts[1]}."
    else:
        test_token = token
    
    return test_token, payload

if __name__ == "__main__":
    token, payload = generate_test_sovtes_token()
    
    print("Generated Test Sovtes JWT Token:")
    print("=" * 80)
    print(token)
    print()
    print("Payload:")
    print(json.dumps(payload, indent=2))
    print()
    print("Valid until:", datetime.fromtimestamp(payload['exp']))