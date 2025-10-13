import requests
import logging
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status

logger = logging.getLogger("tacho_data")

@api_view(["GET"])
def get_tacho_data(request, driver_id):
    api_key = "aE-kSFg5-2mdgFsXTmeUQeTKckOmTMxO"
    url = f"https://api.fm-track.com/drivers/{driver_id}/current-time-analysis?version=1&api_key={api_key}"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "curl/7.87.0",
    }

    try:
        # Log the request for debugging
        logger.debug(f"Fetching data from URL: {url}")
        logger.debug(f"Headers: {headers}")

        # Make the GET request
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an error for HTTP status codes >= 400

        # Log the response for debugging
        logger.debug(f"Response Status: {response.status_code}")
        logger.debug(f"Response Content: {response.json()}")

        # Return the JSON response
        return Response(response.json(), status=response.status_code)

    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching data: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

