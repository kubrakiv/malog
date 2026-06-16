from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from base.utils.api_utils import get_api_token
from base.models import Truck, Trailer
from base.serializers import TruckSerializer, TrailerSerializer
from base.subscription_models import ClientSubscription
import requests


def _str_field(val):
    """Extract a plain string from a Sovtes field that may be an object like {id, title_ru}."""
    if val is None:
        return ""
    if isinstance(val, dict):
        return val.get("title_ru") or val.get("title") or val.get("name") or str(val.get("id", ""))
    return str(val)


def _int_year(val):
    """Safely parse a year value from Sovtes (may be int, string, or '0000')."""
    if not val:
        return None
    try:
        y = int(str(val).strip())
        return y if y > 1900 else None
    except (ValueError, TypeError):
        return None

BASE_URL = "https://sovtes.ua"


def _sovtes_get(path):
    """GET request to Sovtes API with automatic token refresh on expiry."""
    token = get_api_token()
    headers = {"Authorization": token, "Language": "en"}
    url = f"{BASE_URL}{path}"

    response = requests.get(url, headers=headers)
    data = response.json()

    if data.get("status") == "error" and data.get("message") in (
        "Token is invalid",
        "Token is required",
    ):
        token = get_api_token(force_refresh=True)
        headers["Authorization"] = token
        response = requests.get(url, headers=headers)
        data = response.json()

    return data


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getSovtesTrucks(request):
    """Fetch the client's trucks from Sovtes and annotate which are already synced."""
    try:
        data = _sovtes_get("/a/v2/rest/public/getMyCars")

        if data.get("status") != "success":
            return Response(
                {"error": data.get("message", "Failed to fetch trucks from Sovtes")},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        synced_ids = set(
            Truck.objects.filter(
                client=request.user.client,
                sovtes_id__isnull=False,
            ).values_list("sovtes_id", flat=True)
        )

        trucks = data.get("data", [])
        for truck in trucks:
            truck["already_synced"] = str(truck.get("id", "")) in synced_ids

        return Response(trucks)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getSovtesTrailers(request):
    """Fetch the client's trailers from Sovtes and annotate which are already synced."""
    try:
        data = _sovtes_get("/a/v2/rest/public/getMyTrailers")

        if data.get("status") != "success":
            return Response(
                {"error": data.get("message", "Failed to fetch trailers from Sovtes")},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        synced_ids = set(
            Trailer.objects.filter(
                client=request.user.client,
                sovtes_id__isnull=False,
            ).values_list("sovtes_id", flat=True)
        )

        trailers = data.get("data", [])
        for trailer in trailers:
            trailer["already_synced"] = str(trailer.get("id", "")) in synced_ids

        return Response(trailers)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def syncSovtesTruck(request):
    """Import a Sovtes truck into the local database."""
    try:
        client = request.user.client
        sovtes_data = request.data
        sovtes_id = str(sovtes_data.get("id", "")).strip()

        if not sovtes_id:
            return Response(
                {"error": "Sovtes truck ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Truck.objects.filter(client=client, sovtes_id=sovtes_id).exists():
            return Response(
                {"error": "This truck is already synced"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            subscription = ClientSubscription.objects.get(client=client, status="active")
            current_count = Truck.objects.filter(client=client).count()
            if not subscription.can_create_truck(current_count):
                return Response(
                    {
                        "error": "Truck limit reached for current subscription plan",
                        "current_count": current_count,
                        "limit": subscription.plan.truck_limit,
                        "plan": subscription.plan.display_name,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        except ClientSubscription.DoesNotExist:
            return Response(
                {"error": "No active subscription found"},
                status=status.HTTP_403_FORBIDDEN,
            )

        truck = Truck.objects.create(
            client=client,
            sovtes_id=sovtes_id,
            plates=_str_field(sovtes_data.get("number") or sovtes_data.get("carNumber") or sovtes_data.get("govNumber")),
            brand=_str_field(sovtes_data.get("make") or sovtes_data.get("brandTitle") or sovtes_data.get("brand")),
            model=_str_field(sovtes_data.get("model")),
            vin_code=_str_field(sovtes_data.get("vin") or sovtes_data.get("vin_code")),
            year=_int_year(sovtes_data.get("year_of_manufact") or sovtes_data.get("year")),
        )

        serializer = TruckSerializer(truck)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resyncSovtesTruck(request):
    """Update an existing Sovtes-synced truck's fields from the latest Sovtes data."""
    try:
        sovtes_data = request.data
        sovtes_id = str(sovtes_data.get("id", "")).strip()

        if not sovtes_id:
            return Response({"error": "Sovtes truck ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            truck = Truck.objects.get(sovtes_id=sovtes_id)
        except Truck.DoesNotExist:
            return Response({"error": "Synced truck not found"}, status=status.HTTP_404_NOT_FOUND)

        _apply_sovtes_truck_fields(truck, sovtes_data)
        truck.save()

        serializer = TruckSerializer(truck)
        return Response(serializer.data)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def syncSovtesTrailer(request):
    """Import a Sovtes trailer into the local database."""
    try:
        client = request.user.client
        sovtes_data = request.data
        sovtes_id = str(sovtes_data.get("id", "")).strip()

        if not sovtes_id:
            return Response(
                {"error": "Sovtes trailer ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Trailer.objects.filter(client=client, sovtes_id=sovtes_id).exists():
            return Response(
                {"error": "This trailer is already synced"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        trailer = Trailer.objects.create(
            client=client,
            sovtes_id=sovtes_id,
            plates=_str_field(sovtes_data.get("number") or sovtes_data.get("carNumber") or sovtes_data.get("govNumber")),
            brand=_str_field(sovtes_data.get("make") or sovtes_data.get("brandTitle") or sovtes_data.get("brand")),
            vin_code=_str_field(sovtes_data.get("vin") or sovtes_data.get("vin_code")),
            year=_int_year(sovtes_data.get("year_of_manufact") or sovtes_data.get("year")),
        )

        serializer = TrailerSerializer(trailer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _apply_sovtes_truck_fields(truck, sovtes_data):
    """Apply Sovtes truck fields onto a local Truck instance (does not save)."""
    plates = _str_field(sovtes_data.get("number") or sovtes_data.get("carNumber") or sovtes_data.get("govNumber"))
    brand = _str_field(sovtes_data.get("make") or sovtes_data.get("brandTitle") or sovtes_data.get("brand"))
    model = _str_field(sovtes_data.get("model"))
    vin_code = _str_field(sovtes_data.get("vin") or sovtes_data.get("vin_code"))
    year = _int_year(sovtes_data.get("year_of_manufact") or sovtes_data.get("year"))
    if plates:
        truck.plates = plates
    if brand:
        truck.brand = brand
    if model:
        truck.model = model
    if vin_code:
        truck.vin_code = vin_code
    if year is not None:
        truck.year = year


def _apply_sovtes_trailer_fields(trailer, sovtes_data):
    """Apply Sovtes trailer fields onto a local Trailer instance (does not save)."""
    # Sovtes trailer fields: number→plates, make→brand (plain string), year_of_manufact→year
    # Note: trailers have no vin field in Sovtes
    plates = _str_field(sovtes_data.get("number") or sovtes_data.get("carNumber") or sovtes_data.get("govNumber"))
    brand = _str_field(sovtes_data.get("make") or sovtes_data.get("brandTitle") or sovtes_data.get("brand"))
    vin_code = _str_field(sovtes_data.get("vin") or sovtes_data.get("vin_code"))
    year = _int_year(sovtes_data.get("year_of_manufact") or sovtes_data.get("year"))
    if plates:
        trailer.plates = plates
    if brand:
        trailer.brand = brand
    if vin_code:
        trailer.vin_code = vin_code
    if year is not None:
        trailer.year = year


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def linkSovtesTruck(request):
    """Link an existing manually-added truck to its Sovtes counterpart."""
    try:
        data = request.data
        local_truck_id = data.get("local_truck_id")
        sovtes_id = str(data.get("id", "")).strip()

        if not local_truck_id or not sovtes_id:
            return Response(
                {"error": "local_truck_id and Sovtes id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            truck = Truck.objects.get(id=local_truck_id)
        except Truck.DoesNotExist:
            return Response({"error": "Local truck not found"}, status=status.HTTP_404_NOT_FOUND)

        # Use the truck's own client for duplicate checks so this works regardless
        # of which user account originally created the truck.
        truck_client = truck.client

        if truck.sovtes_id and truck.sovtes_id != sovtes_id:
            return Response(
                {"error": "This truck is already linked to a different Sovtes vehicle"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Truck.objects.filter(client=truck_client, sovtes_id=sovtes_id).exclude(id=local_truck_id).exists():
            return Response(
                {"error": "This Sovtes truck is already linked to another local truck"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        truck.sovtes_id = sovtes_id
        _apply_sovtes_truck_fields(truck, data)
        truck.save()

        serializer = TruckSerializer(truck)
        return Response(serializer.data)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def linkSovtesTrailer(request):
    """Link an existing manually-added trailer to its Sovtes counterpart."""
    try:
        data = request.data
        local_trailer_id = data.get("local_trailer_id")
        sovtes_id = str(data.get("id", "")).strip()

        if not local_trailer_id or not sovtes_id:
            return Response(
                {"error": "local_trailer_id and Sovtes id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            trailer = Trailer.objects.get(id=local_trailer_id)
        except Trailer.DoesNotExist:
            return Response({"error": "Local trailer not found"}, status=status.HTTP_404_NOT_FOUND)

        trailer_client = trailer.client

        if trailer.sovtes_id and trailer.sovtes_id != sovtes_id:
            return Response(
                {"error": "This trailer is already linked to a different Sovtes vehicle"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Trailer.objects.filter(client=trailer_client, sovtes_id=sovtes_id).exclude(id=local_trailer_id).exists():
            return Response(
                {"error": "This Sovtes trailer is already linked to another local trailer"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        trailer.sovtes_id = sovtes_id
        _apply_sovtes_trailer_fields(trailer, data)
        trailer.save()

        serializer = TrailerSerializer(trailer)
        return Response(serializer.data)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resyncSovtesTrailer(request):
    """Update an existing Sovtes-synced trailer's fields from the latest Sovtes data."""
    try:
        sovtes_data = request.data
        sovtes_id = str(sovtes_data.get("id", "")).strip()

        if not sovtes_id:
            return Response({"error": "Sovtes trailer ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            trailer = Trailer.objects.get(sovtes_id=sovtes_id)
        except Trailer.DoesNotExist:
            return Response({"error": "Synced trailer not found"}, status=status.HTTP_404_NOT_FOUND)

        _apply_sovtes_trailer_fields(trailer, sovtes_data)
        trailer.save()

        serializer = TrailerSerializer(trailer)
        return Response(serializer.data)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resyncAllSovtesTrucks(request):
    """Re-sync all Sovtes-linked trucks in one request."""
    try:
        client = request.user.client
        linked = Truck.objects.filter(client=client, sovtes_id__isnull=False).exclude(sovtes_id="")

        if not linked.exists():
            return Response({"updated": 0, "trucks": []})

        sovtes_data = _sovtes_get("/a/v2/rest/public/getMyCars")
        if sovtes_data.get("status") != "success":
            return Response(
                {"error": sovtes_data.get("message", "Failed to fetch from Sovtes")},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        sovtes_map = {str(t["id"]): t for t in sovtes_data.get("data", [])}
        updated = []

        for truck in linked:
            sovtes_truck = sovtes_map.get(truck.sovtes_id)
            if not sovtes_truck:
                continue
            _apply_sovtes_truck_fields(truck, sovtes_truck)
            truck.save()
            updated.append(truck)

        serializer = TruckSerializer(updated, many=True)
        return Response({"updated": len(updated), "trucks": serializer.data})

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resyncAllSovtesTrailers(request):
    """Re-sync all Sovtes-linked trailers in one request."""
    try:
        client = request.user.client
        linked = Trailer.objects.filter(client=client, sovtes_id__isnull=False).exclude(sovtes_id="")

        if not linked.exists():
            return Response({"updated": 0, "trailers": []})

        sovtes_data = _sovtes_get("/a/v2/rest/public/getMyTrailers")
        if sovtes_data.get("status") != "success":
            return Response(
                {"error": sovtes_data.get("message", "Failed to fetch from Sovtes")},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        sovtes_map = {str(t["id"]): t for t in sovtes_data.get("data", [])}
        updated = []

        for trailer in linked:
            sovtes_trailer = sovtes_map.get(trailer.sovtes_id)
            if not sovtes_trailer:
                continue
            _apply_sovtes_trailer_fields(trailer, sovtes_trailer)
            trailer.save()
            updated.append(trailer)

        serializer = TrailerSerializer(updated, many=True)
        return Response({"updated": len(updated), "trailers": serializer.data})

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
