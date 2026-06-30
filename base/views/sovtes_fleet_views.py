import os

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from base.utils.api_utils import get_api_token
from base.models import Truck, Trailer
from base.serializers import TruckSerializer, TrailerSerializer
from base.subscription_models import ClientSubscription
from user.models import DriverProfile, Profile, Role
from user.serializers import DriverProfileSerializer
from django.db import transaction
import secrets
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

BASE_URL = os.getenv("SOVTES_BASE_URL", "https://sovtes.ua")

# All known Sovtes messages that mean the session token expired
_SESSION_EXPIRED_MESSAGES = frozenset({
    "Token is invalid",
    "Token is required",
    "Ваша сесія не є дійсна",
})


def _sovtes_headers():
    return {"Authorization": get_api_token(), "Language": "en"}


def _sovtes_get(path):
    """GET request to Sovtes API with automatic token refresh on expiry."""
    headers = _sovtes_headers()
    url = f"{BASE_URL}{path}"
    response = requests.get(url, headers=headers)
    data = response.json()

    if data.get("status") == "error" and data.get("message") in _SESSION_EXPIRED_MESSAGES:
        headers["Authorization"] = get_api_token(force_refresh=True)
        response = requests.get(url, headers=headers)
        data = response.json()

    return data


def _sovtes_put(path, payload):
    """PUT request to Sovtes API — used for updateCar / updateTrailer."""
    headers = _sovtes_headers()
    url = f"{BASE_URL}{path}"
    response = requests.put(url, json=payload, headers=headers)

    try:
        data = response.json()
    except Exception:
        return {"status": "error", "message": f"HTTP {response.status_code}"}

    if data.get("status") == "error" and data.get("message") in _SESSION_EXPIRED_MESSAGES:
        headers["Authorization"] = get_api_token(force_refresh=True)
        response = requests.put(url, json=payload, headers=headers)
        try:
            data = response.json()
        except Exception:
            data = {"status": "error", "message": f"HTTP {response.status_code}"}

    return data


def _sovtes_delete(path):
    """DELETE request to Sovtes API — used for deleteCar / deleteTrailer."""
    headers = _sovtes_headers()
    url = f"{BASE_URL}{path}"
    response = requests.delete(url, headers=headers)

    try:
        data = response.json()
    except Exception:
        return {"status": "error", "message": f"HTTP {response.status_code}"}

    if data.get("status") == "error" and data.get("message") in _SESSION_EXPIRED_MESSAGES:
        headers["Authorization"] = get_api_token(force_refresh=True)
        response = requests.delete(url, headers=headers)
        try:
            data = response.json()
        except Exception:
            data = {"status": "error", "message": f"HTTP {response.status_code}"}

    return data


def _push_truck_to_sovtes(truck):
    """
    Push local truck fields to Sovtes via PUT /a/v2/rest/public/updateCar.
    Only called when truck.sovtes_id is set. Returns the Sovtes response dict.
    """
    payload = {
        "number": truck.plates or "",
        "make": truck.brand or "",
        "model": truck.model or "",
        "vin": truck.vin_code or "",
        "year_of_manufact": int(truck.year) if truck.year else 0,
    }
    return _sovtes_put(f"/a/v2/rest/public/updateCar/{truck.sovtes_id}", payload)


def _push_trailer_to_sovtes(trailer):
    """
    Push local trailer fields to Sovtes via PUT /a/v2/rest/public/updateTrailer.
    Only called when trailer.sovtes_id is set.
    """
    payload = {
        "number": trailer.plates or "",
        "make": trailer.brand or "",
        "vin": trailer.vin_code or "",
        "year_of_manufact": int(trailer.year) if trailer.year else 0,
    }
    return _sovtes_put(f"/a/v2/rest/public/updateTrailer/{trailer.sovtes_id}", payload)


def _delete_truck_from_sovtes(sovtes_id):
    """DELETE /a/v2/rest/public/deleteCar/{id} — remove truck from Sovtes."""
    return _sovtes_delete(f"/a/v2/rest/public/deleteCar/{sovtes_id}")


def _delete_trailer_from_sovtes(sovtes_id):
    """DELETE /a/v2/rest/public/deleteTrailer/{id} — remove trailer from Sovtes."""
    return _sovtes_delete(f"/a/v2/rest/public/deleteTrailer/{sovtes_id}")


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
                is_removed=False,
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
                is_removed=False,
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

        serializer = TruckSerializer(truck, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resyncSovtesTruck(request):
    """Fetch this truck's current data from Sovtes and write missing/updated fields to TMS."""
    try:
        sovtes_id = str(request.data.get("id", "")).strip()

        if not sovtes_id:
            return Response({"error": "Sovtes truck ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            truck = Truck.objects.get(sovtes_id=sovtes_id, client=request.user.client)
        except Truck.DoesNotExist:
            return Response({"error": "Synced truck not found"}, status=status.HTTP_404_NOT_FOUND)

        # Fetch live data directly from Sovtes so we always have the full field set
        sovtes_response = _sovtes_get("/a/v2/rest/public/getMyCars")
        if sovtes_response.get("status") != "success":
            return Response(
                {"error": sovtes_response.get("message", "Failed to fetch from Sovtes")},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        sovtes_truck = next(
            (t for t in sovtes_response.get("data", []) if str(t.get("id")) == sovtes_id),
            None,
        )
        if not sovtes_truck:
            return Response(
                {"error": f"Truck {sovtes_id} not found in Sovtes"},
                status=status.HTTP_404_NOT_FOUND,
            )

        _apply_sovtes_truck_fields(truck, sovtes_truck)
        truck.save()

        serializer = TruckSerializer(truck, context={'request': request})
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

        serializer = TrailerSerializer(trailer, context={'request': request})
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
            truck = Truck.objects.get(id=local_truck_id, client=request.user.client)
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

        serializer = TruckSerializer(truck, context={'request': request})
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
            trailer = Trailer.objects.get(id=local_trailer_id, client=request.user.client)
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

        serializer = TrailerSerializer(trailer, context={'request': request})
        return Response(serializer.data)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resyncSovtesTrailer(request):
    """Fetch this trailer's current data from Sovtes and write missing/updated fields to TMS."""
    try:
        sovtes_id = str(request.data.get("id", "")).strip()

        if not sovtes_id:
            return Response({"error": "Sovtes trailer ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            trailer = Trailer.objects.get(sovtes_id=sovtes_id, client=request.user.client)
        except Trailer.DoesNotExist:
            return Response({"error": "Synced trailer not found"}, status=status.HTTP_404_NOT_FOUND)

        # Fetch live data directly from Sovtes so we always have the full field set
        sovtes_response = _sovtes_get("/a/v2/rest/public/getMyTrailers")
        if sovtes_response.get("status") != "success":
            return Response(
                {"error": sovtes_response.get("message", "Failed to fetch from Sovtes")},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        sovtes_trailer = next(
            (t for t in sovtes_response.get("data", []) if str(t.get("id")) == sovtes_id),
            None,
        )
        if not sovtes_trailer:
            return Response(
                {"error": f"Trailer {sovtes_id} not found in Sovtes"},
                status=status.HTTP_404_NOT_FOUND,
            )

        print(f"[resync-trailer] raw Sovtes data for id={sovtes_id}: {sovtes_trailer}")
        _apply_sovtes_trailer_fields(trailer, sovtes_trailer)
        trailer.save()

        serializer = TrailerSerializer(trailer, context={'request': request})
        return Response(serializer.data)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resyncAllSovtesTrucks(request):
    """Re-sync all Sovtes-linked trucks in one request."""
    try:
        client = request.user.client
        linked = Truck.objects.filter(client=client, sovtes_id__isnull=False, is_removed=False).exclude(sovtes_id="")

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

        serializer = TruckSerializer(updated, many=True, context={'request': request})
        return Response({"updated": len(updated), "trucks": serializer.data})

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resyncAllSovtesTrailers(request):
    """Re-sync all Sovtes-linked trailers in one request."""
    try:
        client = request.user.client
        linked = Trailer.objects.filter(client=client, sovtes_id__isnull=False, is_removed=False).exclude(sovtes_id="")

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

        serializer = TrailerSerializer(updated, many=True, context={'request': request})
        return Response({"updated": len(updated), "trailers": serializer.data})

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── Driver helpers ────────────────────────────────────────────────────────────

def _get_driver_full_name(sovtes_data):
    """Extract full name from Sovtes driver data."""
    # Sovtes API returns lastname/firstname/patronymic as separate fields
    last = _str_field(sovtes_data.get("lastname") or sovtes_data.get("lastName") or sovtes_data.get("last_name"))
    first = _str_field(sovtes_data.get("firstname") or sovtes_data.get("firstName") or sovtes_data.get("first_name"))
    patronymic = _str_field(sovtes_data.get("patronymic") or sovtes_data.get("middleName") or sovtes_data.get("middle_name"))
    full = " ".join(filter(None, [last, first, patronymic]))
    if full:
        return full
    return _str_field(sovtes_data.get("fullName") or sovtes_data.get("full_name") or sovtes_data.get("name")) or ""


def _apply_sovtes_driver_fields(driver, sovtes_data):
    """Apply Sovtes driver fields onto a local DriverProfile instance (does not save)."""
    full_name = _get_driver_full_name(sovtes_data)
    phone = _str_field(
        sovtes_data.get("maincellphone") or sovtes_data.get("phone")
        or sovtes_data.get("phoneNumber") or sovtes_data.get("phone_number")
    )
    license_number = _str_field(
        sovtes_data.get("driverlicensenumber") or sovtes_data.get("licenseNumber")
        or sovtes_data.get("license_number") or sovtes_data.get("driverLicenseNumber")
    )
    if full_name:
        driver.full_name = full_name
    if phone:
        driver.phone_number = phone
    if license_number:
        driver.license_number = license_number


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getSovtesDrivers(request):
    """Fetch the client's drivers from Sovtes and annotate which are already synced."""
    try:
        data = _sovtes_get("/a/v2/rest/public/getMyDrivers")

        if data.get("status") != "success":
            return Response(
                {"error": data.get("message", "Failed to fetch drivers from Sovtes")},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        synced_ids = set(
            DriverProfile.objects.filter(
                profile__client=request.user.client,
                sovtes_id__isnull=False,
            ).exclude(sovtes_id="").values_list("sovtes_id", flat=True)
        )

        drivers = data.get("data", [])
        for driver in drivers:
            driver["already_synced"] = str(driver.get("id", "")) in synced_ids

        return Response(drivers)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def syncSovtesDriver(request):
    """Import a Sovtes driver into the local database."""
    try:
        client = request.user.client
        sovtes_data = request.data
        sovtes_id = str(sovtes_data.get("id", "")).strip()

        if not sovtes_id:
            return Response({"error": "Sovtes driver ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        if DriverProfile.objects.filter(profile__client=client, sovtes_id=sovtes_id).exists():
            return Response({"error": "This driver is already synced"}, status=status.HTTP_400_BAD_REQUEST)

        full_name = _get_driver_full_name(sovtes_data)
        phone = _str_field(
            sovtes_data.get("maincellphone") or sovtes_data.get("phone")
            or sovtes_data.get("phoneNumber") or sovtes_data.get("phone_number")
        )
        license_number = _str_field(
            sovtes_data.get("driverlicensenumber") or sovtes_data.get("licenseNumber")
            or sovtes_data.get("license_number") or sovtes_data.get("driverLicenseNumber")
        )

        driver_role = Role.objects.filter(name="driver").first()
        username = f"sovtes_driver_{sovtes_id}_{client.id}"

        with transaction.atomic():
            # get_or_create handles an orphaned Profile left by a previously failed sync
            profile, profile_created = Profile.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@sovtes.import",
                    "client": client,
                    "role": driver_role,
                    "first_name": full_name.split()[0] if full_name else "",
                    "last_name": " ".join(full_name.split()[1:]) if full_name and len(full_name.split()) > 1 else "",
                    "phone_number": phone,
                },
            )
            if profile_created:
                profile.set_password(secrets.token_urlsafe(16))
                profile.save(update_fields=["password"])

            # get_or_create handles a DriverProfile that already exists for this
            # profile but with a different/null sovtes_id (data inconsistency)
            driver, driver_created = DriverProfile.objects.get_or_create(
                profile=profile,
                defaults={
                    "full_name": full_name,
                    "phone_number": phone,
                    "license_number": license_number,
                    "sovtes_id": sovtes_id,
                },
            )
            if not driver_created:
                driver.sovtes_id = sovtes_id
                if full_name:
                    driver.full_name = full_name
                if phone:
                    driver.phone_number = phone
                if license_number:
                    driver.license_number = license_number
                driver.save()

        serializer = DriverProfileSerializer(driver, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resyncSovtesDriver(request):
    """Fetch this driver's current data from Sovtes and update the local record."""
    try:
        sovtes_id = str(request.data.get("id", "")).strip()

        if not sovtes_id:
            return Response({"error": "Sovtes driver ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            driver = DriverProfile.objects.get(sovtes_id=sovtes_id, profile__client=request.user.client)
        except DriverProfile.DoesNotExist:
            return Response({"error": "Synced driver not found"}, status=status.HTTP_404_NOT_FOUND)

        sovtes_response = _sovtes_get("/a/v2/rest/public/getMyDrivers")
        if sovtes_response.get("status") != "success":
            return Response(
                {"error": sovtes_response.get("message", "Failed to fetch from Sovtes")},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        sovtes_driver = next(
            (d for d in sovtes_response.get("data", []) if str(d.get("id")) == sovtes_id),
            None,
        )
        if not sovtes_driver:
            return Response({"error": f"Driver {sovtes_id} not found in Sovtes"}, status=status.HTTP_404_NOT_FOUND)

        _apply_sovtes_driver_fields(driver, sovtes_driver)
        driver.save()

        serializer = DriverProfileSerializer(driver, context={"request": request})
        return Response(serializer.data)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def linkSovtesDriver(request):
    """Link an existing local driver to its Sovtes counterpart."""
    try:
        data = request.data
        local_driver_id = data.get("local_driver_id")
        sovtes_id = str(data.get("id", "")).strip()

        if not local_driver_id or not sovtes_id:
            return Response(
                {"error": "local_driver_id and Sovtes id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            driver = DriverProfile.objects.get(profile=local_driver_id, profile__client=request.user.client)
        except DriverProfile.DoesNotExist:
            return Response({"error": "Local driver not found"}, status=status.HTTP_404_NOT_FOUND)

        if driver.sovtes_id and driver.sovtes_id != sovtes_id:
            return Response({"error": "This driver is already linked to a different Sovtes record"}, status=status.HTTP_400_BAD_REQUEST)

        if DriverProfile.objects.filter(profile__client=request.user.client, sovtes_id=sovtes_id).exclude(profile=local_driver_id).exists():
            return Response({"error": "This Sovtes driver is already linked to another local driver"}, status=status.HTTP_400_BAD_REQUEST)

        driver.sovtes_id = sovtes_id
        _apply_sovtes_driver_fields(driver, data)
        driver.save()

        serializer = DriverProfileSerializer(driver, context={"request": request})
        return Response(serializer.data)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resyncAllSovtesDrivers(request):
    """Re-sync all Sovtes-linked drivers in one request."""
    try:
        client = request.user.client
        linked = DriverProfile.objects.filter(
            profile__client=client,
            sovtes_id__isnull=False,
        ).exclude(sovtes_id="")

        if not linked.exists():
            return Response({"updated": 0, "drivers": []})

        sovtes_data = _sovtes_get("/a/v2/rest/public/getMyDrivers")
        if sovtes_data.get("status") != "success":
            return Response(
                {"error": sovtes_data.get("message", "Failed to fetch from Sovtes")},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        sovtes_map = {str(d["id"]): d for d in sovtes_data.get("data", [])}
        updated = []

        for driver in linked:
            sovtes_driver = sovtes_map.get(driver.sovtes_id)
            if not sovtes_driver:
                continue
            _apply_sovtes_driver_fields(driver, sovtes_driver)
            driver.save()
            updated.append(driver)

        serializer = DriverProfileSerializer(updated, many=True, context={"request": request})
        return Response({"updated": len(updated), "drivers": serializer.data})

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
