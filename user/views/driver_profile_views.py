from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, BasePermission
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from user.models import DriverProfile
from user.serializers import DriverProfileSerializer

from django.contrib.auth.hashers import make_password


@api_view(["GET"])
def getDriverProfiles(request):
    client = getattr(request.user, 'client', None)
    if client:
        drivers = DriverProfile.objects.filter(profile__client=client)
    else:
        drivers = DriverProfile.objects.all()
    serializer = DriverProfileSerializer(drivers, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(["GET"])
def getDriverProfile(request, pk):
    driver = get_object_or_404(DriverProfile, profile=pk)
    serializer = DriverProfileSerializer(driver, many=False, context={'request': request})
    return Response(serializer.data)


@api_view(["PUT"])
def updateDriverProfile(request, pk):
    driver = get_object_or_404(DriverProfile, profile__id=pk)
    serializer = DriverProfileSerializer(
        instance=driver,
        data=request.data,
        partial=True,
        context={'request': request},
    )
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=200)
    return Response(serializer.errors, status=400)


@api_view(["POST"])
def uploadDriverImage(request):
    data = request.data

    driver_id = data["driver_id"]
    driver = DriverProfile.objects.get(profile=driver_id)
    driver.image = request.FILES.get("image")
    driver.save()

    # Get the URL of the uploaded image
    image_url = request.build_absolute_uri(driver.image.url)

    # Return the URL of the uploaded image in the response
    return Response({"image_url": image_url}, status=status.HTTP_201_CREATED)

@api_view(["POST"])
def createDriverProfile(request):
    data = request.data
    driver = DriverProfile.objects.create(
        profile_id=data["profile"],
        image="default.jpg",
        license_number=data["license_number"],
        license_expiry_date=data["license_expiry_date"],
        license_image="default.jpg",
        truck_id=data["truck"],
        truck_image="default.jpg",
        truck_license_number=data["truck_license_number"],
        truck_license_expiry_date=data["truck_license_expiry_date"],
        truck_license_image="default.jpg",
        is_verified=False
    )

    serializer = DriverProfileSerializer(driver, many=False)
    return Response(serializer.data)

@api_view(["DELETE"])
def deleteDriverProfile(request, pk):
    driver = DriverProfile.objects.get(profile=pk)
    driver.delete()
    return Response("Driver Profile Deleted Successfully")


