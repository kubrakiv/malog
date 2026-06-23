from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from base.models import Truck, TruckUnit, TruckUnitAssignment, DriverUnitAssignment
from base.serializers import TruckUnitSerializer, TruckUnitAssignmentSerializer, DriverUnitAssignmentSerializer
from user.models import DriverProfile

DEFAULT_UNIT_NAMES = [
    "Міжнародна колона",
    "Українська колона",
    "Контейнеровози колона",
]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def listTruckUnits(request):
    """List all truck units for the current tenant, seeding defaults if none exist."""
    client = request.user.client
    units = TruckUnit.objects.filter(client=client)

    # First access: seed the three default units
    if not units.exists():
        for name in DEFAULT_UNIT_NAMES:
            TruckUnit.objects.get_or_create(client=client, name=name)
        units = TruckUnit.objects.filter(client=client)

    serializer = TruckUnitSerializer(units, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def createTruckUnit(request):
    """Create a new truck unit for the current tenant."""
    client = request.user.client
    name = request.data.get("name", "").strip()
    if not name:
        return Response({"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST)
    if TruckUnit.objects.filter(client=client, name=name).exists():
        return Response({"error": "Unit with this name already exists"}, status=status.HTTP_400_BAD_REQUEST)
    unit = TruckUnit.objects.create(client=client, name=name)
    return Response(TruckUnitSerializer(unit, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def deleteTruckUnit(request, pk):
    """Delete a truck unit. Active assignments are ended first."""
    try:
        unit = TruckUnit.objects.get(id=pk, client=request.user.client)
    except TruckUnit.DoesNotExist:
        return Response({"error": "Unit not found"}, status=status.HTTP_404_NOT_FOUND)

    # Close any active assignments for this unit
    TruckUnitAssignment.objects.filter(unit=unit, is_active=True).update(
        end_date=timezone.now(), is_active=False
    )
    unit.delete()
    return Response({"message": "Unit deleted"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def assignTruckUnit(request):
    """
    Assign a truck to a unit (or remove it with unit_id=null).
    Closes the current active assignment and opens a new one.
    """
    truck_id = request.data.get("truck_id")
    unit_id = request.data.get("unit_id")  # null/None = remove from all units

    if not truck_id:
        return Response({"error": "truck_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    client = request.user.client
    if not client:
        return Response({"error": "User has no client assigned"}, status=status.HTTP_403_FORBIDDEN)

    # Use all_objects to bypass TenantManager (which relies on thread-local client
    # set by TenantMiddleware — not available for JWT-only requests)
    try:
        truck = Truck.all_objects.get(id=truck_id, client=client)
    except Truck.DoesNotExist:
        return Response({"error": "Truck not found"}, status=status.HTTP_404_NOT_FOUND)

    # Close any currently active assignment
    TruckUnitAssignment.all_objects.filter(truck=truck, is_active=True).update(
        end_date=timezone.now(), is_active=False
    )

    if unit_id:
        try:
            unit = TruckUnit.all_objects.get(id=unit_id, client=client)
        except TruckUnit.DoesNotExist:
            return Response({"error": "Unit not found"}, status=status.HTTP_404_NOT_FOUND)

        assignment = TruckUnitAssignment.objects.create(
            truck=truck,
            unit=unit,
            client=truck.client,
            start_date=timezone.now(),
            is_active=True,
        )
        return Response(TruckUnitAssignmentSerializer(assignment, context={'request': request}).data, status=status.HTTP_201_CREATED)

    return Response({"message": "Truck removed from unit"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def truckUnitHistory(request, truck_id):
    """Return the full assignment history for a truck."""
    assignments = TruckUnitAssignment.objects.filter(
        truck__id=truck_id,
        truck__client=request.user.client,
    )
    serializer = TruckUnitAssignmentSerializer(assignments, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def assignDriverUnit(request):
    """
    Assign a driver to a unit (or remove with unit_id=null).
    Closes the current active assignment and opens a new one.
    """
    driver_id = request.data.get("driver_id")
    unit_id = request.data.get("unit_id")

    if not driver_id:
        return Response({"error": "driver_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    client = request.user.client
    if not client:
        return Response({"error": "User has no client assigned"}, status=status.HTTP_403_FORBIDDEN)

    try:
        driver = DriverProfile.objects.get(profile__id=driver_id, profile__client=client)
    except DriverProfile.DoesNotExist:
        return Response({"error": "Driver not found"}, status=status.HTTP_404_NOT_FOUND)

    # Close any currently active assignment
    DriverUnitAssignment.all_objects.filter(driver=driver, is_active=True).update(
        end_date=timezone.now(), is_active=False
    )

    if unit_id:
        try:
            unit = TruckUnit.all_objects.get(id=unit_id, client=client)
        except TruckUnit.DoesNotExist:
            return Response({"error": "Unit not found"}, status=status.HTTP_404_NOT_FOUND)

        assignment = DriverUnitAssignment.objects.create(
            driver=driver,
            unit=unit,
            client=client,
            start_date=timezone.now(),
            is_active=True,
        )
        return Response(DriverUnitAssignmentSerializer(assignment, context={'request': request}).data, status=status.HTTP_201_CREATED)

    return Response({"message": "Driver removed from unit"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def driverUnitHistory(request, driver_id):
    """Return the full unit assignment history for a driver."""
    assignments = DriverUnitAssignment.objects.filter(
        driver__profile__id=driver_id,
        driver__profile__client=request.user.client,
    )
    serializer = DriverUnitAssignmentSerializer(assignments, many=True, context={'request': request})
    return Response(serializer.data)
