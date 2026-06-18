from django.shortcuts import render, get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from rest_framework.response import Response
from rest_framework import status

from base.models import (
    Platform
)
from base.serializers import (
    PlatformSerializer,
)


# PLATFORMS VIEWS


@api_view(["GET"])
def getPlatforms(request):
    platforms = Platform.objects.filter(client=request.user.client)
    serializer = PlatformSerializer(platforms, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(["GET"])
def getPlatform(request, pk):
    platform = Platform.objects.get(id=pk, client=request.user.client)
    serializer = PlatformSerializer(platform, many=False, context={'request': request})
    return Response(serializer.data)

