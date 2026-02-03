"""
YouScore API Proxy Views

This module provides endpoints to proxy requests to the YouScore API,
handling authentication, pagination, and data aggregation.
"""

import logging
import requests
import time
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status
from base.entry_data import YOUSCORE_API_TOKEN
from base.models import ExternalAPIKey

logger = logging.getLogger("youscore_proxy")

# YouScore API configuration
YOUSCORE_BASE_URL = "https://api.youscore.com.ua/"
YOUSCORE_ENDPOINT = "v1/vehicles/owned"


def _poll_youscore_url(url, headers, max_attempts=30, poll_interval=1):
    """
    Poll a YouScore URL until data is ready.
    
    Args:
        url: The URL to poll (typically from currentDataUrl in 202 response)
        headers: Request headers with authorization
        max_attempts: Maximum number of polling attempts (default: 30)
        poll_interval: Seconds to wait between attempts (default: 1)
    
    Returns:
        dict with either "response" (successful response object) or "error" (error message)
    """
    logger.info(f"Starting to poll URL: {url}")
    
    for attempt in range(max_attempts):
        try:
            logger.debug(f"Poll attempt {attempt + 1}/{max_attempts}")
            response = requests.get(url, headers=headers, timeout=10)
            
            # If we get 202 again, the data is still being processed
            if response.status_code == 202:
                logger.debug(f"Still processing (202). Waiting {poll_interval}s before retry...")
                time.sleep(poll_interval)
                continue
            
            # If we get 200, the data is ready
            elif response.status_code == 200:
                logger.info(f"Data ready (200) after {attempt + 1} attempts")
                return {"response": response}
            
            # Any other status code is an error
            else:
                logger.error(f"Unexpected status {response.status_code} when polling: {response.text}")
                return {
                    "error": f"Error polling YouScore data: {response.status_code}",
                    "details": response.text
                }
        
        except requests.exceptions.Timeout:
            logger.warning(f"Poll attempt {attempt + 1} timed out")
            if attempt < max_attempts - 1:
                time.sleep(poll_interval)
                continue
            return {"error": "Polling timed out after multiple attempts"}
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error polling URL: {str(e)}")
            return {"error": f"Error polling YouScore: {str(e)}"}
    
    # Max attempts exceeded
    logger.error(f"Polling failed: exceeded {max_attempts} attempts")
    return {
        "error": "YouScore data processing took too long. Please try again.",
        "details": f"Data not ready after {max_attempts} polling attempts"
    }



@api_view(["GET"])
@permission_classes([AllowAny])  # We'll add custom API key authentication in the decorator
def get_vehicles_owned(request):
    """
    Proxy endpoint to fetch all vehicles owned by a contractor from YouScore API.
    
    This endpoint:
    1. Validates the API key from the request headers
    2. Forwards the request to YouScore API
    3. Handles pagination to collect all results
    4. Returns the complete dataset
    
    Query Parameters:
        - contractorCode: Company code (required)
        - top: Number of results per page (optional, default: 100)
        - skip: Number of results to skip (optional, default: 0)
        - showCurrentData: Boolean flag (optional, default: False)
    
    Headers:
        - X-API-Key: API key for authentication (required)
    
    Returns:
        JSON response with all vehicle data
    """
    
    # ── 1. Validate API key from request headers ───────────────────────────────
    api_key = request.headers.get('X-API-Key')
    
    if not api_key:
        logger.warning("Missing API key in request headers")
        return Response(
            {"error": "Missing API key. Please provide X-API-Key header."},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Validate the API key against the database
    try:
        api_key_obj = ExternalAPIKey.objects.get(key=api_key)
        
        # Check if the key is valid
        if not api_key_obj.is_valid():
            logger.warning(f"Expired or inactive API key attempt: {api_key[:10]}...")
            return Response(
                {"error": "Invalid or expired API key"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check endpoint access
        if not api_key_obj.can_access_endpoint(request.path):
            logger.warning(f"API key {api_key_obj.name} attempted to access unauthorized endpoint: {request.path}")
            return Response(
                {"error": "This API key is not authorized to access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check IP whitelist if configured
        client_ip = request.META.get('REMOTE_ADDR')
        if not api_key_obj.can_access_from_ip(client_ip):
            logger.warning(f"API key {api_key_obj.name} used from unauthorized IP: {client_ip}")
            return Response(
                {"error": "This API key cannot be used from your IP address"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check rate limit
        if not api_key_obj.check_rate_limit():
            logger.warning(f"Rate limit exceeded for API key: {api_key_obj.name}")
            return Response(
                {"error": "Rate limit exceeded. Please try again later."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Record usage
        api_key_obj.record_usage()
        logger.info(f"Valid API key used: {api_key_obj.name} from IP {client_ip}")
        
    except ExternalAPIKey.DoesNotExist:
        logger.warning(f"Invalid API key attempt: {api_key[:10]}...")
        return Response(
            {"error": "Invalid API key"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # ── 2. Validate YouScore API token ─────────────────────────────────────────
    if not YOUSCORE_API_TOKEN:
        logger.error("Missing YOUSCORE_API_TOKEN in configuration")
        return Response(
            {"error": "Server misconfigured: missing YouScore API credentials"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # ── 3. Extract query parameters ────────────────────────────────────────────
    contractor_code = request.query_params.get("contractorCode")
    
    if not contractor_code:
        return Response(
            {"error": "contractorCode is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Optional parameters with defaults
    top = int(request.query_params.get("top", 100))  # Fetch 100 records per page for efficiency
    show_current_data = request.query_params.get("showCurrentData", "False")
    
    # ── 4. Prepare headers for YouScore API ────────────────────────────────────
    headers = {
        "Authorization": f"Bearer {YOUSCORE_API_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    
    # ── 5. Make single API request with pagination support ───────────────────
    all_results = []
    total_results = None
    next_page_url = None
    
    try:
        logger.info(f"Fetching vehicles for contractor: {contractor_code}")
        
        # Build the request URL
        url = f"{YOUSCORE_BASE_URL}{YOUSCORE_ENDPOINT}"
        params = {
            "contractorCode": contractor_code,
            "top": top,
            "skip": request.query_params.get("skip", 0),
            "showCurrentData": show_current_data
        }
        
        logger.debug(f"[YouScore] GET {url} params={params}")
        
        # Make the request to YouScore API
        response = requests.get(url, headers=headers, params=params, timeout=30)
        
        # Handle 202 Accepted - data is being updated in background
        if response.status_code == 202:
            logger.info(f"YouScore returned 202 (Accepted). Processing is in progress.")
            response_data = response.json()
            current_data_url = response_data.get("currentDataUrl")
            
            if current_data_url:
                logger.info(f"Polling for data at: {current_data_url}")
                # Poll the currentDataUrl with retry logic
                poll_response = _poll_youscore_url(current_data_url, headers)
                
                if poll_response.get("error"):
                    return Response(poll_response, status=status.HTTP_504_GATEWAY_TIMEOUT)
                
                response = poll_response.get("response")
            else:
                logger.error("202 response without currentDataUrl")
                return Response(
                    {
                        "error": "YouScore API returned 202 but no currentDataUrl provided",
                        "details": response_data
                    },
                    status=status.HTTP_202_ACCEPTED
                )
        
        # Check for other errors
        elif response.status_code != 200:
            logger.error(f"YouScore API error: {response.status_code} - {response.text}")
            return Response(
                {
                    "error": f"YouScore API returned error: {response.status_code}",
                    "details": response.text
                },
                status=response.status_code
            )
        
        # Parse the response
        data = response.json()
        
        # Extract data from response
        total_results = data.get("totalResults", 0)
        results = data.get("results", [])
        next_page_url = data.get("nextPageUrl")
        
        logger.info(f"Fetched {len(results)} results from YouScore (Total available: {total_results})")
            
        # ── 6. Return the response with pagination info ──────────────────────────
        logger.info(f"Successfully fetched {len(results)} vehicles for contractor {contractor_code}")
        
        response_data = {
            "totalResults": total_results,
            "resultsCount": len(results),
            "contractorCode": contractor_code,
            "results": results
        }
        
        # Include nextPageUrl if available for client-side pagination
        if next_page_url:
            response_data["nextPageUrl"] = next_page_url
            logger.debug(f"Next page available: {next_page_url}")
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except requests.exceptions.Timeout:
        logger.error("YouScore API request timeout")
        return Response(
            {"error": "Request to YouScore API timed out"},
            status=status.HTTP_504_GATEWAY_TIMEOUT
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"YouScore API request error: {str(e)}")
        return Response(
            {"error": f"Failed to connect to YouScore API: {str(e)}"},
            status=status.HTTP_502_BAD_GATEWAY
        )
    except Exception as e:
        logger.error(f"Unexpected error in YouScore proxy: {str(e)}")
        return Response(
            {"error": "Internal server error occurred"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for YouScore proxy service
    """
    return Response({
        "status": "ok",
        "service": "YouScore Proxy API",
        "endpoint": f"{YOUSCORE_BASE_URL}{YOUSCORE_ENDPOINT}",
        "documentation": {
            "usage": "GET /api/youscore/vehicles/owned?contractorCode=XXX",
            "authentication": "Include X-API-Key header with your API key",
            "parameters": {
                "contractorCode": "Company code (required)",
                "top": "Results per page (optional, default: 100)",
                "skip": "Results to skip (optional, default: 0)",
                "showCurrentData": "Boolean flag (optional, default: False)"
            }
        }
    }, status=status.HTTP_200_OK)
