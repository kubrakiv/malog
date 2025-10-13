from django.shortcuts import render, get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from base.models import Currency
from base.serializers import CurrencySerializer


@api_view(["GET"])
def getCurrencies(request):
    currency = Currency.objects.all()
    serializer = CurrencySerializer(currency, many=True)
    return Response(serializer.data)
