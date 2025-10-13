import requests
from base.models import APIToken
from base.entry_data import sovtes_auth_data, sovtes_static_token

BASE_URL = "https://sovtes.ua"

def get_api_token(force_refresh=False):
    """
    Retrieves a valid API token. If force_refresh is True, it fetches a new token.
    """
    if not force_refresh:
        token = APIToken.get_token()
        if token:
            return token

    url = f"{BASE_URL}/a/v2/rest/public/auth"
    payload = {
        "login": sovtes_auth_data["login"],
        "password": sovtes_auth_data["password"],
    }
    headers = {
        "Authorization": sovtes_static_token,
        "Language": "en",
    }

    response = requests.post(url, data=payload, headers=headers)
    response_data = response.json()

    if response_data.get("status") == "success":
        token = response_data["data"]["token"]
        APIToken.update_token(token)
        return token
    else:
        raise Exception("Failed to fetch token: " + response_data.get("message", "Unknown error"))

