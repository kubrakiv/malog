import os
import logging
import requests
from django.conf import settings
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from base.entry_data import RUPTELA_API_KEY

logger = logging.getLogger("ruptela_trips")

@api_view(["GET"])
def get_ruptela_trips(request, object_id):
    """
    Proxy Ruptela trips:
      GET /api/ruptela/objects/<object_id>/trips?from_datetime=...&to_datetime=...

    Returns:
      { "trips": [ ... ] }
    """
    # ── API key (prefer env/setting; avoid hardcoding) ───────────────────────────
    # api_key = getattr(settings, "RUPTELA_API_KEY", None) or os.environ.get("RUPTELA_API_KEY")
    api_key = RUPTELA_API_KEY
    if not api_key:
        logger.error("Missing RUPTELA_API_KEY")
        return Response({"error": "Server misconfigured: missing RUPTELA_API_KEY"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    from_dt = request.query_params.get("from_datetime")
    to_dt   = request.query_params.get("to_datetime")
    if not from_dt or not to_dt:
        return Response(
            {"error": "from_datetime and to_datetime are required (UTC ISO, e.g. 2025-07-14T11:00:00Z)"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    base_url = f"https://api.fm-track.com/objects/{object_id}/trips"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "curl/7.87.0",
    }
    params = {
        "version": "1",
        "api_key": api_key,
        "from_datetime": from_dt,
        "to_datetime": to_dt,
    }

    all_trips = []
    token = None

    try:
        # Follow pagination defensively (max 20 pages)
        for _ in range(20):
            if token:
                params["continuation_token"] = token

            logger.debug(f"[Ruptela] GET {base_url} params={params}")
            resp = requests.get(base_url, headers=headers, params=params, timeout=30)
            logger.debug(f"[Ruptela] Status: {resp.status_code}")
            resp.raise_for_status()

            data = resp.json()
            trips = data.get("trips", [])
            all_trips.extend(trips)
            logger.debug(f"[Ruptela] Page trips: {len(trips)}, total so far: {len(all_trips)}")

            token = data.get("continuation_token")
            if not token:
                break

        return Response({"trips": all_trips}, status=status.HTTP_200_OK)

    except requests.exceptions.RequestException as e:
        logger.error(f"[Ruptela] Error for object_id={object_id}: {e}")
        # 502 fits “upstream” errors
        return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)
