from django.shortcuts import render, get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from base.models import Country
from base.serializers import CountriesSerializer


@api_view(["GET"])
def getCountries(request):
    countries = Country.objects.all()
    serializer = CountriesSerializer(countries, many=True)
    return Response(serializer.data)
    