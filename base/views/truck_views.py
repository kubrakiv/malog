from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from rest_framework.response import Response
from rest_framework import status

from base.models import Truck, Trailer, DriverProfile
from user.models import LogistProfile, Profile
from base.serializers import TruckSerializer
from base.subscription_models import ClientSubscription
from base.views.sovtes_fleet_views import (
    _push_truck_to_sovtes,
    _delete_truck_from_sovtes,
)


# TRUCK VIEWS


@api_view(["GET"])
def getTrucks(request):
    trucks = Truck.objects.filter(client=request.user.client, is_removed=False).order_by('id')
    serializer = TruckSerializer(trucks, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def createTruck(request):
    try:
        client = request.user.client
        subscription = ClientSubscription.objects.get(client=client, status='active')

        current_truck_count = Truck.objects.filter(client=client, is_removed=False).count()
        if not subscription.can_create_truck(current_truck_count):
            return Response(
                {
                    'error': 'Truck limit reached for current subscription plan',
                    'current_count': current_truck_count,
                    'limit': subscription.plan.truck_limit,
                    'plan': subscription.plan.display_name
                },
                status=status.HTTP_403_FORBIDDEN
            )
    except ClientSubscription.DoesNotExist:
        return Response(
            {'error': 'No active subscription found'},
            status=status.HTTP_403_FORBIDDEN
        )

    data = request.data

    end_date = data.get("end_date") or None
    entry_date = data.get("entry_date") or None
    year = data.get("year") or None
    price = int(float(data.get("price"))) if data.get("price") else None

    truck = Truck.objects.create(
        brand=data.get("brand"),
        model=data.get("model"),
        plates=data.get("plates"),
        vin_code=data.get("vin_code"),
        year=year,
        entry_date=entry_date,
        end_date=end_date,
        entry_mileage=data.get("entry_mileage"),
        price=price,
        gps_id=data.get("gps_id"),
        client=client,
    )
    serializer = TruckSerializer(truck, many=False, context={'request': request})
    return Response(serializer.data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def deleteTruck(request, pk):
    allowed_roles = {"admin", "client_admin", "system_admin"}
    user_role = getattr(getattr(request.user, "role", None), "name", None)
    if not request.user.is_superuser and user_role not in allowed_roles:
        return Response(
            {"error": "You do not have permission to delete trucks"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        truck = Truck.objects.get(id=pk, client=request.user.client, is_removed=False)
    except Truck.DoesNotExist:
        return Response({"error": "Truck not found"}, status=status.HTTP_404_NOT_FOUND)

    sovtes_id = truck.sovtes_id

    # Soft-delete in TMS
    truck.is_removed = True
    truck.is_removed_at = timezone.now()
    truck.save(update_fields=["is_removed", "is_removed_at"])

    # Mirror deletion in Sovtes if the truck was synced
    sovtes_result = None
    if sovtes_id:
        try:
            sovtes_result = _delete_truck_from_sovtes(sovtes_id)
        except Exception as e:
            sovtes_result = {"status": "error", "message": str(e)}

    return Response({
        "message": "Truck removed",
        "sovtes": sovtes_result,
    })


@api_view(["PUT"])
def updateTruckTrailerAndDriver(request, pk):
    data = request.data
    try:
        truck = Truck.objects.get(id=pk, client=request.user.client, is_removed=False)
    except Truck.DoesNotExist:
        return Response({"error": "Truck not found"}, status=404)

    # Handle trailer update
    trailer_plates = data.get("trailer")
    if trailer_plates:
        try:
            trailer = Trailer.objects.get(plates=trailer_plates, client=request.user.client)
            truck.trailer = trailer
        except Trailer.DoesNotExist:
            return Response({"error": "Trailer not found"}, status=404)
    elif trailer_plates is None or trailer_plates == "":
        truck.trailer = None

    # Handle driver update
    driver_name = data.get("driver")
    if driver_name:
        driver = DriverProfile.objects.filter(
            full_name=driver_name,
            profile__client=request.user.client,
        ).first()
        if not driver:
            return Response({"error": "Driver not found"}, status=404)
        truck.driver = driver
    elif driver_name is None or driver_name == "":
        truck.driver = None

    truck.save()

    # Handle logist update (ManyToMany — must come after save())
    if "logist" in data:
        logist_ids = data.get("logist") or []
        if not isinstance(logist_ids, list):
            logist_ids = [logist_ids]
        if not logist_ids:
            truck.logist.clear()
        else:
            resolved = []
            for lid in logist_ids:
                try:
                    profile = Profile.objects.get(
                        id=int(lid),
                        client=request.user.client,
                        role__name="logist",
                    )
                    logist, _ = LogistProfile.objects.get_or_create(profile=profile)
                    resolved.append(logist)
                except (Profile.DoesNotExist, ValueError, TypeError):
                    pass
            truck.logist.set(resolved)

    serializer = TruckSerializer(instance=truck, partial=True, context={'request': request})
    return Response(serializer.data)


@api_view(["PUT"])
def updateTruck(request, pk):
    try:
        truck = Truck.objects.get(id=pk, client=request.user.client, is_removed=False)
    except Truck.DoesNotExist:
        return Response({"error": "Truck not found"}, status=404)

    data = request.data

    truck.brand = data.get("brand") or None
    truck.model = data.get("model") or None
    truck.plates = data.get("plates")
    truck.vin_code = data.get("vin_code") or None
    truck.year = int(data.get("year")) if data.get("year") else None
    truck.entry_date = data.get("entry_date") or None
    truck.end_date = data.get("end_date") or None
    truck.entry_mileage = data.get("entry_mileage") or None
    truck.price = int(float(data.get("price"))) if data.get("price") else None
    truck.gps_id = data.get("gps_id") or None
    truck.diesel_norm = data.get("diesel_norm") or None
    truck.adblue_norm = data.get("adblue_norm") or None
    truck.tire_cost_per_km = data.get("tire_cost_per_km") or None

    truck.save()

    # Push changes to Sovtes if this truck is linked
    if truck.sovtes_id:
        try:
            _push_truck_to_sovtes(truck)
        except Exception:
            pass  # Sovtes push failure must not block TMS response

    serializer = TruckSerializer(instance=truck, partial=True, context={'request': request})
    return Response(serializer.data)
