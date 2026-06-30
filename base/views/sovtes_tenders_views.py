import hashlib
import json
import os
import time

from django.http import HttpResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import close_old_connections
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import AccessToken
from base.utils.api_utils import get_api_token
import requests

BASE_URL = os.getenv("SOVTES_BASE_URL", "https://sovtes.ua") + "/a/v2/rest/public"


def _sovtes(method, endpoint, params=None, json=None):
    """Authenticated proxy to Sovtes API with auto token refresh."""
    token = get_api_token()
    headers = {"Authorization": token, "Language": "en"}
    url = f"{BASE_URL}/{endpoint}"

    resp = getattr(requests, method)(url, headers=headers, params=params, json=json)
    data = resp.json()

    if data.get("status") == "error" and data.get("message") in (
        "Token is invalid",
        "Token is required",
        "Ваша сесія не є дійсна",
        "Операція недоступна, для продовження роботи оновіть сторінку та авторизуйтесь",
    ):
        token = get_api_token(force_refresh=True)
        headers["Authorization"] = token
        resp = getattr(requests, method)(url, headers=headers, params=params, json=json)
        data = resp.json()

    return data


def _ok(data):
    if data.get("status") != "success":
        print(f"[sovtes] error response: {data}")
    return data.get("status") == "success"


@api_view(["GET"])
def getTenderGroups(request):
    data = _sovtes("get", "getTenderGroups")
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to fetch tender groups")}, status=400)
    return Response(data.get("data", []))


@api_view(["GET"])
def getCurrentTenders(request):
    data = _sovtes("get", "getCurrentTenders")
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to fetch current tenders")}, status=400)
    return Response(data.get("data", []))


@api_view(["GET"])
def getMyTenders(request):
    data = _sovtes("get", "getMyTenders")
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to fetch my tenders")}, status=400)
    return Response(data.get("data", []))


@api_view(["GET"])
def getBasicDetailsOfRoutes(request):
    routes = request.query_params.get("routes", "")
    if not routes:
        return Response({"error": "routes parameter is required"}, status=400)
    data = _sovtes("get", "getBasicDetailsOfRoutes", params={"routes": routes})
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to fetch route details")}, status=400)
    raw = data.get("data", [])
    # API returns {"periodic": [card, ...], ...} — flatten to a single list of card dicts
    if isinstance(raw, dict):
        items = []
        for v in raw.values():
            if isinstance(v, list):
                items.extend(v)
            elif isinstance(v, dict):
                items.append(v)
    else:
        items = raw if isinstance(raw, list) else []
    return Response(items)


@api_view(["GET", "POST"])
def notInterestedView(request):
    if request.method == "GET":
        data = _sovtes("get", "getNotInterested", params={"tender": 1})
        if not _ok(data):
            return Response({"error": data.get("message", "Failed to fetch hidden tenders")}, status=400)
        return Response(data.get("data", []))
    else:
        data = _sovtes("post", "notInterested", json=request.data)
        if not _ok(data):
            return Response({"error": data.get("message", "Failed to update not interested")}, status=400)
        return Response(data.get("data", {}))


@api_view(["GET"])
def getCompleteRoutes(request):
    page = request.query_params.get("page", 1)
    per_page = request.query_params.get("perPage", 10)
    data = _sovtes("get", "getCompleteRoutes", params={"page": page, "perPage": per_page})
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to fetch completed routes")}, status=400)
    return Response(data.get("data", {}))


@api_view(["GET"])
def singleRouteView(request):
    route = request.query_params.get("route", "")
    if not route:
        return Response({"error": "route parameter is required"}, status=400)
    data = _sovtes("get", "singleRoute", params={"route": route})
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to fetch route")}, status=400)
    return Response(data.get("data", {}).get("route", {}))


@api_view(["GET"])
def getTenderChildrenView(request):
    tender_periodic = request.query_params.get("tenderPeriodic", "")
    if not tender_periodic:
        return Response({"error": "tenderPeriodic parameter is required"}, status=400)
    data = _sovtes("get", "getTenderChildren", params={"tenderPeriodic": tender_periodic})
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to fetch tender children")}, status=400)
    return Response(data.get("data", []))


@api_view(["GET"])
def getRouteActionsView(request):
    routes = request.query_params.get("routes", "")
    if not routes:
        return Response({"error": "routes parameter is required"}, status=400)
    data = _sovtes("get", "getRouteActions", params={"routes": routes})
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to fetch route actions")}, status=400)
    return Response(data.get("data", {}))


@api_view(["GET"])
def getTenderSteps(request):
    route = request.query_params.get("route", "")
    if not route:
        return Response({"error": "route parameter is required"}, status=400)
    data = _sovtes("get", "getTenderSteps", params={"route": route})
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to fetch tender steps")}, status=400)
    return Response(data.get("data", {}))


@api_view(["POST"])
def bookmarkView(request):
    data = _sovtes("post", "bookmark", json=request.data)
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to bookmark")}, status=400)
    return Response(data.get("data", {}))


@api_view(["POST"])
def cancelPricequoteView(request):
    data = _sovtes("post", "cancelPricequote", json=request.data)
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to cancel price quote")}, status=400)
    return Response(data.get("data", {}))


@api_view(["POST"])
def revivePricequoteView(request):
    data = _sovtes("post", "revivePricequote", json=request.data)
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to revive price quote")}, status=400)
    return Response(data.get("data", {}))


@api_view(["GET"])
def getPricequotesView(request):
    route = request.query_params.get("route", "")
    if not route:
        return Response({"error": "route parameter is required"}, status=400)
    data = _sovtes("get", "getPricequotes", params={"route": route})
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to fetch pricequotes")}, status=400)
    return Response(data.get("data", []))


@api_view(["GET"])
def getMyDriversView(request):
    data = _sovtes("get", "getMyDrivers", params={"compact": 1})
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to fetch drivers")}, status=400)
    return Response(data.get("data", []))


@api_view(["GET"])
def getMyCarsView(request):
    data = _sovtes("get", "getMyCars", params={"compact": 1})
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to fetch cars")}, status=400)
    return Response(data.get("data", []))


@api_view(["GET"])
def getMyTrailersView(request):
    data = _sovtes("get", "getMyTrailers", params={"compact": 1})
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to fetch trailers")}, status=400)
    return Response(data.get("data", []))


@api_view(["POST"])
def offerAutoView(request):
    data = _sovtes("post", "offerAuto", json=request.data)
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to assign vehicle")}, status=400)
    return Response(data.get("data", {}))


@api_view(["POST"])
def subscribeRouteView(request):
    route = request.data.get("route")
    routeparts_dates = request.data.get("routepartsDates", {})
    routeparts_times = request.data.get("routepartsTimes", {})
    if not route:
        return Response({"error": "route is required"}, status=400)
    payload = {
        "route": route,
        "routepartsDates": routeparts_dates,
        "routepartsTimes": routeparts_times,
    }
    print(f"[confirm-route] payload={payload}")
    data = _sovtes("post", "confirmWorkOnRoute", json=payload)
    print(f"[confirm-route] sovtes response={data}")
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to confirm work on route")}, status=400)
    return Response(data.get("data", {}))


@api_view(["POST"])
def offerPriceQuote(request):
    route = request.data.get("route")
    pricequote = request.data.get("pricequote")
    loadquote = request.data.get("loadquote")

    if not route or pricequote is None or loadquote is None:
        return Response({"error": "route, pricequote, and loadquote are required."}, status=400)

    data = _sovtes("post", "pricequote", json={"route": route, "pricequote": pricequote, "loadquote": loadquote})
    if not _ok(data):
        return Response({"error": data.get("message", "Failed to offer price quote")}, status=400)
    return Response({"message": f"Price quote offered successfully for route {route}."}, status=201)


# ─── Webhooks + SSE ───────────────────────────────────────────────────────────


@csrf_exempt
def sovtes_webhook_receiver(request):
    """Receive Sovtes webhook POSTs and store them so SSE clients are notified."""
    if request.method != "POST":
        return HttpResponse(status=405)

    try:
        payload = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return HttpResponse(status=400)

    from base.models import SovtesWebhookEvent

    event_type = str(payload.get("event") or payload.get("type") or "update")
    periodic = str(payload.get("periodic") or "")
    raw_route = payload.get("route") or payload.get("route_id") or payload.get("id")
    try:
        route_id = int(raw_route) if raw_route is not None else None
    except (TypeError, ValueError):
        route_id = None

    SovtesWebhookEvent.objects.create(
        event_type=event_type,
        periodic=periodic,
        route_id=route_id,
        payload=payload,
    )

    return HttpResponse("OK", status=200)


def _validate_sse_token(request):
    """Accept JWT from Authorization header or ?token= query param."""
    token_str = None
    auth = request.META.get("HTTP_AUTHORIZATION", "")
    if auth.startswith("Bearer "):
        token_str = auth[7:]
    if not token_str:
        token_str = request.GET.get("token", "")
    if not token_str:
        return False
    try:
        AccessToken(token_str)
        return True
    except Exception:
        return False


def sovtes_sse_stream(request):
    """Long-lived SSE endpoint that pushes Sovtes webhook events to the browser."""
    if not _validate_sse_token(request):
        return HttpResponse("Unauthorized", status=401)

    last_id = 0
    try:
        last_id = int(
            request.GET.get("last_id")
            or request.META.get("HTTP_LAST_EVENT_ID")
            or 0
        )
    except (TypeError, ValueError):
        pass

    def event_generator():
        nonlocal last_id
        last_heartbeat = time.time()

        while True:
            try:
                close_old_connections()
                from base.models import SovtesWebhookEvent

                events = SovtesWebhookEvent.objects.filter(
                    id__gt=last_id
                ).order_by("id")[:50]

                for evt in events:
                    last_id = evt.id
                    data = json.dumps(
                        {
                            "type": evt.event_type,
                            "periodic": evt.periodic,
                            "route_id": evt.route_id,
                        }
                    )
                    yield f"id: {evt.id}\ndata: {data}\n\n"

                now = time.time()
                if now - last_heartbeat >= 25:
                    yield ": keepalive\n\n"
                    last_heartbeat = now

            except Exception:
                pass

            time.sleep(2)

    response = StreamingHttpResponse(event_generator(), content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response


# ─── Pusher ───────────────────────────────────────────────────────────────────

_PUSHER_AUTH_URL = os.getenv(
    "PUSHER_CHANNEL_AUTH_ENDPOINT",
    "https://test.sovtes.ua/a/v2/live/auth",
)


@api_view(["GET"])
def pusherConfigView(request):
    """Return Pusher connection parameters for the frontend.

    The channel is per-user (not a fixed env value): private-user-events-<sha256(user.id)>,
    matching the naming scheme the Sovtes side expects for the logged-in user's JWT id.
    """
    if not request.user or not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=401)

    user_id_hash = hashlib.sha256(str(request.user.id).encode()).hexdigest()
    channel = f"private-user-events-{user_id_hash}"

    return Response({
        "key": os.getenv("PUSHER_KEY", ""),
        "cluster": os.getenv("PUSHER_CLUSTER", "eu"),
        "channel": channel,
    })


@csrf_exempt
def pusherAuthView(request):
    """Proxy Pusher private-channel auth to Sovtes' auth endpoint."""
    if request.method != "POST":
        return HttpResponse(status=405)

    if not _validate_sse_token(request):
        return HttpResponse("Unauthorized", status=401)

    socket_id = request.POST.get("socket_id")
    channel_name = request.POST.get("channel_name")

    if not socket_id or not channel_name:
        return HttpResponse(status=400)

    token = get_api_token()
    headers = {"Authorization": token, "Language": "en"}

    resp = requests.post(
        _PUSHER_AUTH_URL,
        data={"socket_id": socket_id, "channel_name": channel_name},
        headers=headers,
    )

    if resp.status_code != 200:
        print(f"[pusher-auth] Sovtes auth failed {resp.status_code}: {resp.text!r} "
              f"(url={_PUSHER_AUTH_URL}, channel={channel_name})")

    return HttpResponse(
        resp.content,
        content_type=resp.headers.get("Content-Type", "application/json"),
        status=resp.status_code,
    )
