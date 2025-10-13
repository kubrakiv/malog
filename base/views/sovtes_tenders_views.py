from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from base.utils.api_utils import get_api_token
from base.parsers.sovtes_parser import parse_route_json as parse_sovtes
import requests
import asyncio
import aiohttp

BASE_URL = "https://sovtes.ua"

async def fetch_single_tender(session, periodic, token):
    """
    Asynchronously fetch single route details using getSingleRoute.
    """
    headers = {"Authorization": f"{token}", "Language": "en"}
    route_url = f"{BASE_URL}/a/v2/rest/public/singleRoute?route={periodic}"

    async with session.get(route_url, headers=headers) as response:
        data = await response.json()
    
        # If token is required, refresh it and retry the request
        if data.get("status") == "error" and data.get("message") == "Token is required":
            new_token = get_api_token(force_refresh=True)
            headers["Authorization"] = f"{new_token}"

            async with session.get(route_url, headers=headers) as retry_response:
                return await retry_response.json()

        return data
    
  
async def fetch_all_tender_details(tenders, token):
    """
    Fetch details for all tenders asynchronously.
    """
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_single_tender(session, tender["periodic"], token) for tender in tenders]
        detailed_tenders = await asyncio.gather(*tasks)

        # Attach details to each tender
        for tender, details in zip(tenders, detailed_tenders):
            tender["details"] = details  # Add fetched details to each tender
    return tenders


@api_view(["GET"])
def getCurrentTenders(request):
    try:
        # Step 1: Authenticate and fetch current tenders
        token = get_api_token()
        headers = {"Authorization": f"{token}", "Language": "en"}
        tenders_url = f"{BASE_URL}/a/v2/rest/public/getCurrentTenders"

        response = requests.get(tenders_url, headers=headers)
        tenders_response = response.json()

        # Refresh token if invalid
        if tenders_response.get("status") == "error" and tenders_response.get("message") == "Token is invalid":
            token = get_api_token(force_refresh=True)
            headers = {"Authorization": f"{token}", "Language": "en"}
            response = requests.get(tenders_url, headers=headers)
            tenders_response = response.json()

        # Handle case: Failed to fetch tenders
        if tenders_response.get("status") != "success":
            return Response({"error": "Failed to fetch tenders"}, status=400) 
        
         # Filter tenders where contextstatus == 91
        filtered_tenders = [tender for tender in tenders_response.get("data", []) if tender.get("contextstatus") == 91]

        # Step 3: Fetch details for all tenders asynchronously
        enriched_tenders = asyncio.run(fetch_all_tender_details(filtered_tenders, token))

        return Response(enriched_tenders, status=200)
    
    except Exception as e:
        print("ERROR:", e)
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def getSingleRoute(request):
    try:
        # Step 1: Extract `routeId` and `platform` from the request body
        route_id = request.data.get("routeId")
        platform = request.data.get("platform")

        if not route_id or not platform:
            return Response({"error": "routeId and platform are required."}, status=400)

        # Step 2: Authenticate and fetch route data
        token = get_api_token()
        headers = {"Authorization": f"{token}", "Language": "en"}
        route_url = f"{BASE_URL}/a/v2/rest/public/singleRoute?route={route_id}"

        response = requests.get(route_url, headers=headers)
        route_response = response.json()

        # Refresh token if invalid
        if route_response.get("status") == "error" and route_response.get("message") == "Token is invalid":
            token = get_api_token(force_refresh=True)
            headers = {"Authorization": f"{token}", "Language": "en"}
            response = requests.get(route_url, headers=headers)
            route_response = response.json()

        # Handle case: No such route
        if route_response.get("status") == "error" and route_response.get("message") == "No such route":
            return Response(
                {"error": f"No such route found for routeId {route_id}."},
                status=404,
            )
        
        # Handle case: Failed to fetch route data
        if route_response.get("status") != "success":
            return Response({"error": "Failed to fetch route data"}, status=400)

        # Step 3: Parse JSON based on platform
        if platform == "sovtes":
            parsed_data = parse_sovtes(route_response["data"]["route"])
        else:
            return Response({"error": "Unsupported platform"}, status=400)

        return Response(
            {"message": f"Order {parsed_data} fetched successfully."},
            status=201,
        )
    except Exception as e:
        print("ERROR:", e)
        return Response({"error": str(e)}, status=500)
    

@api_view(["POST"])
def offerPriceQuote(request):
    try:
        # Step 1: # Extract data from request
        route = request.data.get("route")
        pricequote = request.data.get("pricequote")
        loadquote = request.data.get("loadquote")
        print("Request data:", route, pricequote, loadquote)


        if not route or pricequote is None or loadquote is None:
            return Response({"error": "route, pricequote, and loadquote are required."}, status=400)

        # Step 2: Authenticate and offer price quote
        token = get_api_token()
        headers = {"Authorization": f"{token}", "Language": "en"}
        offer_url = f"{BASE_URL}/a/v2/rest/public/pricequote"

        # Send request using multipart/form-data
        data = {
            "route": route,
            "pricequote": pricequote,
            "loadquote": loadquote,
        }

        response = requests.post(offer_url, headers=headers, json=data)
        offer_response = response.json()
        print("Offer response:", offer_response)

        # Refresh token if invalid
        if offer_response.get("status") == "error" and offer_response.get("message") == "Token is invalid":
            token = get_api_token(force_refresh=True)
            headers = {"Authorization": f"{token}", "Language": "en"}
            response = requests.post(offer_url, headers=headers, json=data)
            offer_response = response.json()

        # Handle failure response
        if offer_response.get("status") != "success":
            return Response({"error": "Failed to offer price quote"}, status=400)

        return Response(
            {"message": f"Price quote offered successfully for route {route}."},
            status=201,
        )
    
    except Exception as e:
        print("ERROR:", e)
        return Response({"error": str(e)}, status=500)