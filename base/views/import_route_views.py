from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from base.utils.api_utils import get_api_token
from base.utils.create_order_utils import create_objects_from_parsed_data
from base.parsers.sovtes_parser import parse_route_json as parse_sovtes
from base.parsers.lkw_parser import parse_route_json as parse_lkw
import requests
import asyncio
import aiohttp

BASE_URL = "https://sovtes.ua"


async def _fetch_single_tender(session, periodic, token):
    headers = {"Authorization": token, "Language": "en"}
    url = f"{BASE_URL}/a/v2/rest/public/singleRoute?route={periodic}"
    async with session.get(url, headers=headers) as resp:
        data = await resp.json()
    if data.get("status") == "error" and data.get("message") == "Token is required":
        from base.utils.api_utils import get_api_token
        new_token = get_api_token(force_refresh=True)
        headers["Authorization"] = new_token
        async with session.get(url, headers=headers) as retry:
            return await retry.json()
    return data


async def fetch_all_tender_details(tenders, token):
    async with aiohttp.ClientSession() as session:
        tasks = [_fetch_single_tender(session, t["periodic"], token) for t in tenders]
        details = await asyncio.gather(*tasks)
    for tender, detail in zip(tenders, details):
        tender["details"] = detail
    return tenders

@api_view(["POST"])
def fetch_and_create_orders(request):
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
        elif platform == "lkw":
            parsed_data = parse_lkw(route_response["data"]["route"])
        else:
            return Response({"error": "Unsupported platform"}, status=400)

        # Step 4: Create Objects
        order = create_objects_from_parsed_data(parsed_data)

        return Response(
            {"message": f"Order {order.order_number} created successfully."},
            status=201,
        )
    except Exception as e:
        print("ERROR:", e)
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def create_route(request):
    try:
        # Step 1: Extract `order` and `platform` from the request body
        order = request.data.get("order")
        platform = request.data.get("platform")

        if not order or not platform:
            return Response({"error": "order and platform are required."}, status=400)

        # Step 3: Parse JSON based on platform
        if platform == "sovtes":
            parsed_data = parse_sovtes(order["data"]["route"])
        elif platform == "lkw":
            parsed_data = parse_lkw(order["data"]["route"])
        else:
            return Response({"error": "Unsupported platform"}, status=400)

        # Step 4: Create Objects
        order = create_objects_from_parsed_data(parsed_data)

        return Response(
            {"message": f"Order {order.order_number} created successfully."},
            status=201,
        )
    except Exception as e:
        print("ERROR:", e)
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_all_routes(request):
    try:
        # Step 1: Authenticate and fetch active routes
        token = get_api_token()
        headers = {"Authorization": f"{token}", "Language": "en"}
        all_routes_url = f"{BASE_URL}/a/v2/rest/public/getAllRoutes"

        response = requests.get(all_routes_url, headers=headers)
        data = response.json()

        # Refresh token if invalid
        if data.get("status") and data.get("message") == "Token is invalid":
            token = get_api_token(force_refresh=True)
            headers = {"Authorization": f"{token}", "Language": "en"}
            response = requests.get(all_routes_url, headers=headers)

        all_routes_response = response.json()        

        # Handle case: Failed to fetch active routes
        if all_routes_response.get("status") != "success":
            return Response({"error": "Failed to fetch active routes"}, status=400)
        
        # Step 2: Extract active routes

        all_routes = all_routes_response["data"]

        filtered_routes = [
            route for route in all_routes
            if route.get("bookedbyclient") is True and route.get("tenderparent") is not None
        ]

        enrich_orders = asyncio.run(fetch_all_tender_details(filtered_routes, token))

        print("Filtered Routes:", filtered_routes)

        return Response(enrich_orders, status=200)
        
    except Exception as e:
        print("ERROR:", e)
        return Response({"error": str(e)}, status=500)
    

