from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from base.models import CostCenter, TruckUnit
from base.serializers import CostCenterSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def listCostCenters(request):
    centers = CostCenter.objects.filter(client=request.user.client)
    return Response(CostCenterSerializer(centers, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def createCostCenter(request):
    data = request.data
    truck_unit_id = data.get("truck_unit")
    truck_unit = None
    if truck_unit_id:
        try:
            truck_unit = TruckUnit.objects.get(id=truck_unit_id, client=request.user.client)
        except TruckUnit.DoesNotExist:
            return Response({"detail": "TruckUnit not found."}, status=status.HTTP_400_BAD_REQUEST)

    center = CostCenter.objects.create(
        client=request.user.client,
        name=data["name"],
        truck_unit=truck_unit,
        monthly_amount=data["monthly_amount"],
        currency=data.get("currency", "UAH"),
        is_active=data.get("is_active", True),
    )
    return Response(CostCenterSerializer(center).data, status=status.HTTP_201_CREATED)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def costCenterDetail(request, pk):
    try:
        center = CostCenter.objects.get(id=pk, client=request.user.client)
    except CostCenter.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        center.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    data = request.data
    center.name = data.get("name", center.name)
    center.monthly_amount = data.get("monthly_amount", center.monthly_amount)
    center.currency = data.get("currency", center.currency)
    center.is_active = data.get("is_active", center.is_active)

    truck_unit_id = data.get("truck_unit")
    if truck_unit_id is not None:
        if truck_unit_id == "" or truck_unit_id is False:
            center.truck_unit = None
        else:
            try:
                center.truck_unit = TruckUnit.objects.get(id=truck_unit_id, client=request.user.client)
            except TruckUnit.DoesNotExist:
                return Response({"detail": "TruckUnit not found."}, status=status.HTTP_400_BAD_REQUEST)

    center.save()
    return Response(CostCenterSerializer(center).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def updateAssumedKm(request):
    """Store per-unit km/planned_trucks in client.settings["unit_settings"].

    Accepts: { "unit_settings": { "1": { "assumed_km": 10000, "planned_trucks": 3 } } }
    """
    client = request.user.client
    settings = dict(client.settings or {})

    unit_settings = request.data.get("unit_settings")
    if unit_settings is None:
        return Response({"detail": "unit_settings required."}, status=400)

    existing = dict(settings.get("unit_settings", {}))
    for uid, vals in unit_settings.items():
        uid = str(uid)
        entry = dict(existing.get(uid, {}))
        if "assumed_km" in vals:
            entry["assumed_km"] = int(vals["assumed_km"])
        if "planned_trucks" in vals:
            entry["planned_trucks"] = int(vals["planned_trucks"])
        existing[uid] = entry

    settings["unit_settings"] = existing
    client.settings = settings
    client.save(update_fields=["settings"])
    return Response({"ok": True})
