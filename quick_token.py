"""
Quick token generator for Postman testing

Usage: python quick_token.py [user_id] [client_id] [user_type] [hours]
"""

import jwt
import sys
from datetime import datetime, timedelta

def generate_quick_token(user_id=2384, client_id=180, user_type=2, hours=48):
    """Generate a quick test token"""
    now = datetime.utcnow()
    
    user_types = {1: "driver", 2: "admin", 3: "logist"}
    
    payload = {
        "sub": "auth",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=hours)).timestamp()),
        "user": {
            "id": int(user_id),
            "client": int(client_id),
            "name": f"test_user_{user_id}",
            "usertype": int(user_type),
            "systemlanguage": 2
        }
    }
    
    token = jwt.encode(payload, "", algorithm="none")
    
    print(f"🔐 Quick Sovtes JWT Token Generated")
    print(f"📋 Details:")
    print(f"   User ID: {user_id}")
    print(f"   Client ID: {client_id}")
    print(f"   Role: {user_types.get(int(user_type), 'unknown')}")
    print(f"   Valid for: {hours} hours")
    print(f"   Expires: {datetime.fromtimestamp(payload['exp'])}")
    print()
    print(f"🎯 Token for Postman:")
    print(token)
    print()
    print(f"📋 Usage in Postman:")
    print(f'   Set sovtes_jwt_token variable to: {token}')

if __name__ == "__main__":
    # Parse command line arguments
    args = sys.argv[1:]
    
    user_id = int(args[0]) if len(args) > 0 else 2384
    client_id = int(args[1]) if len(args) > 1 else 180
    user_type = int(args[2]) if len(args) > 2 else 2
    hours = int(args[3]) if len(args) > 3 else 48
    
    generate_quick_token(user_id, client_id, user_type, hours)