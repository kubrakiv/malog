from django.shortcuts import render, get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from rest_framework.response import Response
from rest_framework import status

from base.models import Invoice, Order, Company, Currency, Customer
from base.serializers import InvoiceSerializer

from user.models import Profile


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getInvoices(request):
    invoices = Invoice.objects.filter(client=request.user.client)
    serializer = InvoiceSerializer(invoices, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getInvoice(request, pk):
    try:
        invoice = Invoice.objects.get(id=pk, client=request.user.client)
    except Invoice.DoesNotExist:
        return Response("Invoice does not exist", status=status.HTTP_404_NOT_FOUND)

    serializer = InvoiceSerializer(invoice, many=False, context={'request': request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def createInvoice(request):
    data = request.data
    order_id = data.get("order_id")
    user_id = data.get("user")
    company_id = data.get("company_id")
    currency_id = data.get("currency")
    customer_id = data.get("customer_id")

    # Check if an invoice already exists for the given order
    if Invoice.objects.filter(order_id=order_id, client=request.user.client).exists():
        return Response(
            {"error": "Invoice for this order already exists. Use the update endpoint."},
            status=400
        )

    user = Profile.objects.get(id=user_id) if user_id else None
    order = Order.objects.get(id=order_id, client=request.user.client) if order_id else None
    company = Company.objects.get(id=company_id, client=request.user.client) if company_id else None
    currency = Currency.objects.get(id=currency_id, client=request.user.client) if currency_id else None
    customer = Customer.objects.get(id=customer_id, client=request.user.client) if customer_id else None

    # Create new invoice
    invoice = Invoice.objects.create(
        service_name=data.get("service_name"),
        truck=data.get("truck"),
        trailer=data.get("trailer"),
        loading_date=data.get("loading_date"),
        unloading_date=data.get("unloading_date"),
        order_number=data.get("order_number"),
        company=company,
        order=order,
        price=data.get("price"),
        vat=data.get("vat"),
        total_price=data.get("total_price"),
        currency=currency,
        currency_rate=data.get("currency_rate"),
        customer=customer,
        invoicing_date=data.get("invoicing_date"),
        vat_date=data.get("vat_date"),
        due_date=data.get("due_date"),
        payment_date=data.get("payment_date"),
        send_date=data.get("send_date"),
        accepted_date=data.get("accepted_date"),
        user=user,
        client=request.user.client,
    )

    serializer = InvoiceSerializer(invoice, many=False, context={'request': request})
    return Response(serializer.data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def deleteInvoice(request, pk):
    try:
        invoice = Invoice.objects.get(id=pk, client=request.user.client)
    except Invoice.DoesNotExist:
        return Response("Invoice does not exist", status=status.HTTP_404_NOT_FOUND)

    # Serialize the invoice before deleting
    serializer = InvoiceSerializer(invoice, many=False, context={'request': request})
    invoice.delete()

    return Response({"message": "Invoice deleted"})


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def updateInvoice(request, pk):
    try:
        invoice = Invoice.objects.get(pk=pk, client=request.user.client)
    except Invoice.DoesNotExist:
        return Response({"error": "Invoice not found"}, status=404)

    data = request.data
    print("Update Invoice Data: ", data)

    # Fetch related objects if IDs are provided
    company_id = data.get("company_id")
    order_id = data.get("order_id")
    currency_id = data.get("currency")
    customer_id = data.get("customer_id")

    company = Company.objects.get(id=company_id, client=request.user.client) if company_id else invoice.company
    order = Order.objects.get(id=order_id, client=request.user.client) if order_id else invoice.order
    currency = Currency.objects.get(id=currency_id, client=request.user.client) if currency_id else invoice.currency
    customer = Customer.objects.get(id=customer_id, client=request.user.client) if customer_id else invoice.customer

    # Update fields
    invoice.service_name = data.get("service_name", invoice.service_name)
    invoice.truck = data.get("truck", invoice.truck)
    invoice.trailer = data.get("trailer", invoice.trailer)
    invoice.loading_date = data.get("loading_date", invoice.loading_date)
    invoice.unloading_date = data.get("unloading_date", invoice.unloading_date)
    invoice.order_number = data.get("order_number", invoice.order_number)
    invoice.company = company
    invoice.order = order
    invoice.price = data.get("price", invoice.price)
    invoice.vat = data.get("vat", invoice.vat)
    invoice.total_price = data.get("total_price", invoice.total_price)
    invoice.currency = currency
    invoice.currency_rate = data.get("currency_rate", invoice.currency_rate)
    invoice.customer = customer
    invoice.invoicing_date = data.get("invoicing_date", invoice.invoicing_date)
    invoice.vat_date = data.get("vat_date", invoice.vat_date)
    invoice.due_date = data.get("due_date", invoice.due_date)
    invoice.payment_date = data.get("payment_date", invoice.payment_date)
    invoice.send_date = data.get("send_date", invoice.send_date)
    invoice.accepted_date = data.get("accepted_date", invoice.accepted_date)

    # Save the invoice
    invoice.save()

    # Serialize and return updated data
    serializer = InvoiceSerializer(invoice, context={'request': request})
    return Response(serializer.data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def updateInvoiceDueDate(request, pk):
    try:
        invoice = Invoice.objects.get(pk=pk, client=request.user.client)
    except Invoice.DoesNotExist:
        return Response({"error": "Invoice not found"}, status=404)
    
    data = request.data
    invoice.payment_date = data.get("payment_date", invoice.payment_date)
    invoice.save()

    serializer = InvoiceSerializer(invoice, context={'request': request})
    return Response(serializer.data)

