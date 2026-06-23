from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.db import transaction
import logging

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, BasePermission
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from user.models import Profile, Role, DriverProfile
from user.serializers import DriverProfileSerializer

from django.contrib.auth.hashers import make_password

logger = logging.getLogger(__name__)


def _ensure_driver_profiles(queryset):
    """Create missing DriverProfile records for a queryset of Profiles with driver role."""
    for profile in queryset:
        full_name = f"{profile.first_name or ''} {profile.last_name or ''}".strip()
        DriverProfile.objects.get_or_create(
            profile=profile,
            defaults={
                'phone_number': profile.phone_number,
                'first_name': profile.first_name,
                'last_name': profile.last_name,
                'full_name': full_name or profile.username,
                'email': profile.email,
            },
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getDriverProfiles(request):
    client = getattr(request.user, 'client', None)
    if not client:
        return Response([], status=status.HTTP_200_OK)

    driver_role = Role.objects.filter(name='driver').first()
    if driver_role:
        candidate_profiles = Profile.objects.filter(client=client, role=driver_role)
        _ensure_driver_profiles(candidate_profiles)

    drivers = DriverProfile.objects.filter(profile__client=client)
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
        try:
            serializer.save()
        except OSError as e:
            return Response({"error": f"Image could not be saved: {e}"}, status=500)
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


