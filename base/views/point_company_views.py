from django.shortcuts import render, get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from base.models import PointCompany
from base.serializers import PointCompaniesSerializer


@api_view(["GET"])
def getPointCompanies(request):
    companies = PointCompany.objects.filter(client=request.user.client)
    serializer = PointCompaniesSerializer(companies, many=True, context={'request': request})
    return Response(serializer.data)
    