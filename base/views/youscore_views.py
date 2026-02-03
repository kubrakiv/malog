"""
YouScore API Proxy Views

This module provides endpoints to proxy requests to the YouScore API,
handling authentication, pagination, and data aggregation.
"""

import logging
import requests
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
    
    # ── 5. Collect all results with pagination ─────────────────────────────────
    all_results = []
    skip = 0
    total_results = None
    next_page_url = None
    max_pages = 100  # Safety limit to prevent infinite loops
    
    try:
        logger.info(f"Starting to fetch vehicles for contractor: {contractor_code}")
        
        for page in range(max_pages):
            # Build the request URL
            url = f"{YOUSCORE_BASE_URL}{YOUSCORE_ENDPOINT}"
            params = {
                "contractorCode": contractor_code,
                "top": top,
                "skip": skip,
                "showCurrentData": show_current_data
            }
            
            logger.debug(f"[YouScore] Page {page + 1}: GET {url} params={params}")
            
            # Make the request to YouScore API
            response = requests.get(url, headers=headers, params=params, timeout=30)
            
            # Check for errors
            if response.status_code != 200:
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
            
            # Store total results count from first response
            if total_results is None:
                total_results = data.get("totalResults", 0)
                logger.info(f"Total results to fetch: {total_results}")
            
            # Get the results from this page
            results = data.get("results", [])
            
            if not results:
                logger.info("No more results, pagination complete")
                break
            
            # Add results to our collection
            all_results.extend(results)
            logger.debug(f"Collected {len(results)} results. Total so far: {len(all_results)}")
            
            # Update next page URL for logging
            next_page_url = data.get("nextPageUrl")
            
            # Check if we've collected all results
            if len(all_results) >= total_results:
                logger.info(f"All {total_results} results collected")
                break
            
            # Move to next page
            skip += top
            
        # ── 6. Return the complete dataset ─────────────────────────────────────
        logger.info(f"Successfully collected {len(all_results)} vehicles for contractor {contractor_code}")
        
        return Response({
            "totalResults": total_results or len(all_results),
            "resultsCount": len(all_results),
            "contractorCode": contractor_code,
            "results": all_results
        }, status=status.HTTP_200_OK)
        
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
