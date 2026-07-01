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

import os
BASE_URL = os.getenv("SOVTES_BASE_URL", "https://sovtes.ua")


TOKEN_ERROR_MESSAGES = {
    "Token is required",
    "Token is invalid",
    "Ваша сесія не є дійсна",
}

NO_ROUTE_MESSAGES = {
    "No such route",
    "Ми не знайшли такого маршруту",
}


def _is_token_error(payload):
    return (
        isinstance(payload, dict)
        and payload.get("status") == "error"
        and payload.get("message") in TOKEN_ERROR_MESSAGES
    )


def _extract_route_points_for_summary(route_parts):
    """Build loading/unloading point labels and short title for preview modal."""
    def _city(part):
        checkpoint = part.get("checkpoint") or {}
        town = checkpoint.get("town") or {}
        return (town.get("title_ru") or "").strip()

    load_points = []
    unload_points = []

    for part in route_parts:
        if not isinstance(part, dict):
            continue
        workaction = part.get("workaction")
        city = _city(part)
        if not city:
            continue
        if workaction == 1 and city not in load_points:
            load_points.append(city)
        if workaction == 2 and city not in unload_points:
            unload_points.append(city)

    route_title = None
    if load_points or unload_points:
        left = load_points[0] if load_points else "—"
        right = unload_points[-1] if unload_points else "—"
        route_title = f"{left} - {right}"

    return load_points, unload_points, route_title


async def _fetch_single_tender(session, periodic, token):
    headers = {"Authorization": token, "Language": "en"}
    url = f"{BASE_URL}/a/v2/rest/public/singleRoute?route={periodic}"
    async with session.get(url, headers=headers) as resp:
        data = await resp.json()
    if data.get("status") == "error" and data.get("message") in ("Token is required", "Token is invalid", "Ваша сесія не є дійсна"):
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


def _fetch_route_response(route_id):
    """Fetch singleRoute payload from Sovtes with token refresh handling."""
    token = get_api_token()
    headers = {"Authorization": f"{token}", "Language": "en"}
    route_url = f"{BASE_URL}/a/v2/rest/public/singleRoute?route={route_id}"

    response = requests.get(route_url, headers=headers)
    route_response = response.json()

    if _is_token_error(route_response):
        token = get_api_token(force_refresh=True)
        headers = {"Authorization": f"{token}", "Language": "en"}
        response = requests.get(route_url, headers=headers)
        route_response = response.json()

    return route_response


@api_view(["POST"])
def preview_route(request):
    """Fetch and parse route details, but do not create any DB objects yet."""
    try:
        route_id = request.data.get("routeId")
        platform = request.data.get("platform")

        if not route_id or not platform:
            return Response({"error": "routeId and platform are required."}, status=400)

        route_response = _fetch_route_response(route_id)

        if (
            isinstance(route_response, dict)
            and route_response.get("status") == "error"
            and route_response.get("message") in NO_ROUTE_MESSAGES
        ):
            return Response(
                {
                    "error": f"No such route found for routeId {route_id}.",
                    "upstream_message": route_response.get("message"),
                },
                status=404,
            )

        if route_response.get("status") != "success":
            return Response(
                {
                    "error": "Failed to fetch route data",
                    "upstream_message": route_response.get("message", "Unknown error"),
                },
                status=400,
            )

        if platform == "sovtes":
            parsed_data = parse_sovtes(route_response["data"]["route"])
        elif platform == "lkw":
            parsed_data = parse_lkw(route_response["data"]["route"])
        else:
            return Response({"error": "Unsupported platform"}, status=400)

        route = route_response.get("data", {}).get("route", {})
        route_parts = route.get("routeparts") or []
        load_points, unload_points, route_title = _extract_route_points_for_summary(route_parts)
        summary = {
            "periodic": route.get("periodic"),
            "payor": (route.get("payorcompany") or {}).get("title"),
            "distance": route.get("distance"),
            "budget": route.get("budget"),
            "currency": (route.get("defaultcurrency") or "UAH").upper(),
            "cargo": (parsed_data.get("order_data") or {}).get("cargo_name"),
            "weight": (parsed_data.get("order_data") or {}).get("cargo_weight"),
            "points_count": len(route_parts),
            "route_title": route_title,
            "loading_points": load_points,
            "unloading_points": unload_points,
            "start_date": route_parts[0].get("date1") if route_parts else None,
            "end_date": route_parts[-1].get("date1") if route_parts else None,
        }

        return Response(
            {
                "message": "Route fetched successfully",
                "summary": summary,
                "order": route_response,
            },
            status=200,
        )
    except Exception as e:
        print("ERROR:", e)
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
def fetch_and_create_orders(request):
    try:
        # Step 1: Extract `routeId` and `platform` from the request body
        route_id = request.data.get("routeId")
        platform = request.data.get("platform")

        if not route_id or not platform:
            return Response({"error": "routeId and platform are required."}, status=400)

        # Step 2: Authenticate and fetch route data
        route_response = _fetch_route_response(route_id)

        # Handle case: No such route (English/Ukrainian API variants)
        if (
            isinstance(route_response, dict)
            and route_response.get("status") == "error"
            and route_response.get("message") in NO_ROUTE_MESSAGES
        ):
            return Response(
                {
                    "error": f"No such route found for routeId {route_id}.",
                    "upstream_message": route_response.get("message"),
                },
                status=404,
            )
        
        # Handle case: Failed to fetch route data
        if route_response.get("status") != "success":
            return Response(
                {
                    "error": "Failed to fetch route data",
                    "upstream_message": route_response.get("message", "Unknown error"),
                },
                status=400,
            )

        # Step 3: Parse JSON based on platform
        if platform == "sovtes":
            parsed_data = parse_sovtes(route_response["data"]["route"])
        elif platform == "lkw":
            parsed_data = parse_lkw(route_response["data"]["route"])
        else:
            return Response({"error": "Unsupported platform"}, status=400)

        # Step 4: Create Objects
        order_data = parsed_data.get("order_data") or {}
        order = create_objects_from_parsed_data(
            parsed_data,
            user=request.user,
            truck_plates=order_data.get("truck_plates"),
            driver_name=order_data.get("driver_name"),
            driver_sovtes_id=order_data.get("driver_sovtes_id"),
        )

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
        order = request.data.get("order")
        platform = request.data.get("platform")
        truck_plates = request.data.get("truck_plates")
        driver_name = request.data.get("driver_name")
        driver_sovtes_id = request.data.get("driver_sovtes_id")

        if not order or not platform:
            return Response({"error": "order and platform are required."}, status=400)

        if platform == "sovtes":
            parsed_data = parse_sovtes(order["data"]["route"])
        elif platform == "lkw":
            parsed_data = parse_lkw(order["data"]["route"])
        else:
            return Response({"error": "Unsupported platform"}, status=400)

        order = create_objects_from_parsed_data(
            parsed_data,
            user=request.user,
            truck_plates=truck_plates,
            driver_name=driver_name,
            driver_sovtes_id=driver_sovtes_id or (parsed_data.get("order_data") or {}).get("driver_sovtes_id"),
        )

        return Response(
            {"message": f"Order {order.order_number} created successfully."},
            status=201,
        )
    except Exception as e:
        print("ERROR:", e)
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_booked_tender_routes(request):
    try:
        # Step 1: Authenticate and fetch active routes
        token = get_api_token()
        headers = {"Authorization": f"{token}", "Language": "en"}
        all_routes_url = f"{BASE_URL}/a/v2/rest/public/getAllRoutes"

        response = requests.get(all_routes_url, headers=headers)
        data = response.json()

        # Refresh token for any known Sovtes auth/session error
        if _is_token_error(data):
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
    

