from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from base.utils.api_utils import get_api_token

import requests

BASE_URL = "https://sovtes.ua"
API_ENDPOINT = f"{BASE_URL}/a/v2/rest/public/offerAuto"

@api_view(["POST"])
def assign_truck_and_driver(request):
    print("Assign Truck and Driver Data: ", request.data)
    try:
        # Step 1: Extract data from the request body
        order_id = request.data.get("route")
        truck_id = request.data.get("car")
        driver_id = request.data.get("driver")
        trailer_id = request.data.get("trailer")
        route_parts = request.data.get("routepartsDates", {})

        if not all([order_id, truck_id, driver_id]):
            return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        # Step 2: Authenticate and set headers
         # Refresh token if invalid
        token = get_api_token()
        headers = {
            "Authorization": f"{token}",
            "Language": "en",
        }

        # Step 3: Prepare payload
        payload = {
            "route": order_id,
            "routepartsDates": route_parts,
            "car": truck_id,
            "driver": driver_id,
            "trailer": trailer_id,
        }

        # Step 4: Send POST request to the external API
        response = requests.post(API_ENDPOINT, json=payload, headers=headers)
        response_data = response.json()

        # Refresh token if invalid
        if response_data.get("status") == "error" and response_data.get("message") == "Token is invalid":
            token = get_api_token(force_refresh=True)
            headers = {
                "Authorization": f"{token}",
                "Language": "en",
            }
            response = requests.post(API_ENDPOINT, json=payload, headers=headers)
            response_data = response.json()

        # Debugging API Response
        print("Response Status Code:", response.status_code)
        print("Response Content:", response.text)

        # Step 5: Handle response from the external API
        if response.status_code in [200, 201]:
            return Response(response_data, status=response.status_code)
        else:
            return Response(response_data, status=response.status_code)

    except requests.exceptions.RequestException as e:
        return Response({"error": "External API request failed", "details": str(e)}, status=status.HTTP_502_BAD_GATEWAY)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)