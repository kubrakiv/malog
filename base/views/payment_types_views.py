from django.shortcuts import render, get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from rest_framework.response import Response
from rest_framework import status

from base.models import (
    PaymentType
)
from base.serializers import (
    PaymentTypeSerializer,
)


# PAYMENT TYPES VIEWS


@api_view(["GET"])
def getPaymentTypes(request):
    payment_types = PaymentType.objects.all()
    serializer = PaymentTypeSerializer(payment_types, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def getPaymentType(request, pk):
    payment_type = PaymentType.objects.get(id=pk)
    serializer = PaymentTypeSerializer(payment_type, many=False)
    return Response(serializer.data)
