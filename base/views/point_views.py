from django.shortcuts import render, get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from rest_framework.response import Response
from rest_framework import status

from base.models import (
    Customer,
    Point,
    PointCompany,
    Country,
)
from base.serializers import PointSerializer
  

# POINTS VIEWS


@api_view(["GET"])
def getPoints(request):
    points = Point.objects.all()
    serializer = PointSerializer(points, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def getPoint(request, pk):
    point = Point.objects.get(id=pk)
    serializer = PointSerializer(point, many=False)
    return Response(serializer.data)


@api_view(["POST"])
def createPoint(request):
    data = request.data

    country_name = data.get("country")
    company_name = data.get("company_name")
    customer_name = data.get("customer")

    country = Country.objects.filter(name=country_name).first()
    company, created = PointCompany.objects.get_or_create(name=company_name)
    customer = Customer.objects.filter(name=customer_name).first()

    point = Point.objects.create(
        country=country,
        postal_code=data.get("postal_code"),
        city=data.get("city"),
        street=data.get("street"),
        street_number=data.get("street_number"),
        gps_latitude=data.get("gps_latitude"),
        gps_longitude=data.get("gps_longitude"),
        company_name=company,
        customer=customer,
    )
    serializer = PointSerializer(point, many=False)
    return Response(serializer.data)


@api_view(["PUT"])
def editPoint(request, pk):
    point = get_object_or_404(Point, id=pk)
    data = request.data

    # Extract country from request data
    country_name = data.get("country")
    country = Country.objects.filter(name=country_name).first()

    # if country:
    #     data["country"] = country.id  # Set country ID in the data for serializer
    # else:
    #     return Response({"error": "Country not found"}, status=400)

    # Debugging: print the updated data before passing to serializer
    print("Updated Request Data: ", data)

    serializer = PointSerializer(instance=point, data=data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    else:
        # Debugging: print serializer errors
        print("Serializer Errors: ", serializer.errors)
        return Response(serializer.errors, status=400)


@api_view(["DELETE"])
def deletePoint(request, pk):
    try:
        point = Point.objects.get(id=pk)
    except Point.DoesNotExist:
        return Response({"error": "Point not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = PointSerializer(point, many=False)
    point.delete()

    return Response({"message": "Point deleted successfully", "data": serializer.data})
