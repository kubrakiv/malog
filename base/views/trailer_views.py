from django.shortcuts import render, get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from rest_framework.response import Response
from rest_framework import status

from base.models import Trailer
from base.serializers import TrailerSerializer


# TRAILER VIEWS

@api_view(["GET"])
def getTrailers(request):
    trailers = Trailer.objects.all()
    serializer = TrailerSerializer(trailers, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def createTrailer(request):
    data = request.data

    entry_date = data.get("entry_date")
    if entry_date == "":
        entry_date = None

    end_date = data.get("end_date")
    if end_date == "":
        end_date = None
    
    year = data.get("year")
    if year == "":
        year = None

    # Convert price to an integer
    price = int(float(data.get("price"))) if data.get("price") else None

    trailer = Trailer.objects.create(
        brand=data.get("brand"),
        plates=data.get("plates"),
        vin_code=data.get("vin_code"),
        year=year,
        entry_date=entry_date,
        end_date=end_date,
        entry_mileage=data.get("entry_mileage"),
        price=price,
    )
    serializer = TrailerSerializer(trailer, many=False)
    return Response(serializer.data)
    

@api_view(["DELETE"])
def deleteTrailer(request, pk):
    try:
        trailer = Trailer.objects.get(id=pk)
        trailer.delete()
        return Response("Trailer deleted")
    except Trailer.DoesNotExist as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)



@api_view(["PUT"])
def updateTrailer(request, pk):
    trailer = Trailer.objects.get(id=pk)
    
    serializer = TrailerSerializer(instance=trailer, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()

    return Response(serializer.data)