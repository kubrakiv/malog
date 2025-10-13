from django.shortcuts import render, get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from rest_framework.response import Response
from rest_framework import status

from base.models import Company
from base.serializers import CompanySerializer


@api_view(["GET"])
def getCompany(request):
    company = Company.objects.first()  # Get the first company or None if no company exists
    if company:
        serializer = CompanySerializer(company, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)
    else:
        return Response(
            {"error": "No company found."},
            status=status.HTTP_404_NOT_FOUND
        )