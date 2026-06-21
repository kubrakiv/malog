from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response
from rest_framework import status

from base.models import Trailer
from base.serializers import TrailerSerializer
from base.views.sovtes_fleet_views import (
    _push_trailer_to_sovtes,
    _delete_trailer_from_sovtes,
)


# TRAILER VIEWS


@api_view(["GET"])
def getTrailers(request):
    trailers = Trailer.objects.filter(client=request.user.client, is_removed=False)
    serializer = TrailerSerializer(trailers, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def createTrailer(request):
    client = request.user.client
    data = request.data

    trailer = Trailer.objects.create(
        client=client,
        brand=data.get("brand"),
        plates=data.get("plates"),
        vin_code=data.get("vin_code"),
        year=data.get("year") or None,
        entry_date=data.get("entry_date") or None,
        end_date=data.get("end_date") or None,
        entry_mileage=data.get("entry_mileage"),
        price=int(float(data.get("price"))) if data.get("price") else None,
    )
    serializer = TrailerSerializer(trailer, many=False, context={'request': request})
    return Response(serializer.data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def deleteTrailer(request, pk):
    try:
        trailer = Trailer.objects.get(id=pk, client=request.user.client, is_removed=False)
    except Trailer.DoesNotExist:
        return Response({"error": "Trailer not found"}, status=status.HTTP_404_NOT_FOUND)

    sovtes_id = trailer.sovtes_id

    # Soft-delete in TMS
    trailer.is_removed = True
    trailer.is_removed_at = timezone.now()
    trailer.save(update_fields=["is_removed", "is_removed_at"])

    # Mirror deletion in Sovtes if the trailer was synced
    sovtes_result = None
    if sovtes_id:
        try:
            sovtes_result = _delete_trailer_from_sovtes(sovtes_id)
        except Exception as e:
            sovtes_result = {"status": "error", "message": str(e)}

    return Response({
        "message": "Trailer removed",
        "sovtes": sovtes_result,
    })


@api_view(["PUT"])
def updateTrailer(request, pk):
    try:
        trailer = Trailer.objects.get(id=pk, client=request.user.client, is_removed=False)
    except Trailer.DoesNotExist:
        return Response({"error": "Trailer not found"}, status=404)

    serializer = TrailerSerializer(instance=trailer, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()

        # Push changes to Sovtes if this trailer is linked
        if trailer.sovtes_id:
            try:
                trailer.refresh_from_db()
                _push_trailer_to_sovtes(trailer)
            except Exception:
                pass  # Sovtes push failure must not block TMS response

    return Response(serializer.data)
