from django.shortcuts import render, get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from base.models import Customer, PaymentType
from base.serializers import CustomerSerializer


@api_view(["GET"])
def getCustomers(request):
    customers = Customer.objects.filter(client=request.user.client)
    serializer = CustomerSerializer(customers, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(["POST"])
def createCustomer(request):

    try:
        data = request.data

        customer = Customer.objects.create(
            name=data["name"],
            nip_number=data["nip_number"],
            vat_number=data["vat_number"],
            email=data["email"],
            website=data["website"],
            post_address=data["post_address"],
            client=request.user.client,
        )
        serializer = CustomerSerializer(customer, many=False, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)})

@api_view(["DELETE"])
def deleteCustomer(request, pk):
    try:
        customer = Customer.objects.get(id=pk, client=request.user.client)
    except Customer.DoesNotExist:
        return Response("Customer does not exist", status=status.HTTP_404_NOT_FOUND)

    # Serialize the customer before deleting
    serializer = CustomerSerializer(customer, many=False, context={'request': request})
    customer.delete()

    return Response({"message": "Customer deleted"})

@api_view(["PUT"])
def updateCustomer(request, pk):
    customer = Customer.objects.get(id=pk, client=request.user.client)

    serializer = CustomerSerializer(instance=customer, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()

    return Response(serializer.data)



