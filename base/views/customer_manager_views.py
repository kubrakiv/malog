from django.shortcuts import render, get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from base.models import Customer, CustomerManager
from base.serializers import CustomerManagerSerializer


@api_view(["GET"])
def getCustomerManagers(request):
    customer_managers = CustomerManager.objects.all()
    serializer = CustomerManagerSerializer(customer_managers, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def createCustomerManager(request):
    try:
        data = request.data
        customer_id = data["customer"]
        customer = Customer.objects.filter(id=customer_id).first() if customer_id else None

        customer_manager = CustomerManager.objects.create(
            full_name=data["full_name"],
            position=data["position"],
            phone=data["phone"],
            email=data["email"],
            customer=customer,
        )
        serializer = CustomerManagerSerializer(customer_manager, many=False)
        return Response(serializer.data, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)
    
@api_view(["DELETE"])
def deleteCustomerManager(request, pk):
    try:
        customer_manager = CustomerManager.objects.get(id=pk)
    except CustomerManager.DoesNotExist:
        return Response("Customer Manager does not exist", status=status.HTTP_404_NOT_FOUND)
    
    # Serialize the customer manager before deleting
    serializer = CustomerManagerSerializer(customer_manager, many=False)
    customer_manager.delete()

    return Response({"message": "Customer Manager deleted"})

@api_view(["PUT"])
def updateCustomerManager(request, pk):
    customer_id = request.data.get("customer")

    if not customer_id:
        return Response({"error": "Customer ID is required."}, status=400)

    # Filter by email and customer ID
    customer_managers = CustomerManager.objects.filter(id=pk, customer_id=customer_id)

    if not customer_managers.exists():
        raise NotFound("Customer manager not found.")

    if customer_managers.count() > 1:
        return Response({"error": "Multiple customer managers found."}, status=400)

    customer_manager = customer_managers.first()

    # Remove the customer field from request data to avoid serializer dotted field issue
    customer = request.data.pop("customer", None)

    # Update other fields using the serializer
    serializer = CustomerManagerSerializer(instance=customer_manager, data=request.data, partial=True)
    if serializer.is_valid():
        customer_manager = serializer.save()
        # Set the customer manually
        if customer:
            customer_manager.customer_id = customer
            customer_manager.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=400)
