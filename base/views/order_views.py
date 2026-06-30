from django.shortcuts import render, get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework import status

from django.db.models import Count

from base.models import (
    Task,
    DriverProfile,
    Truck,
    Order,
    OrderStatus,
    Customer,
    CustomerManager,
    Platform,
    PaymentType,
    Currency,
)
from user.models import Profile
from base.serializers import (
    TaskSerializer,
    OrderSerializer,
)

from datetime import datetime


# ORDERS VIEWS

class OrderPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'


@api_view(["GET"])
def getOrders(request):
    orders = Order.objects.filter(client=request.user.client).prefetch_related("tasks").all().order_by("-id")

    # Apply filters
    driver = request.GET.get("driver")
    truck = request.GET.get("truck")
    customer = request.GET.get("customer")
    status_name = request.GET.get("status")
    category = request.GET.get("category")
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    if driver:
        orders = orders.filter(driver__full_name__icontains=driver)
    if truck:
        orders = orders.filter(truck__plates__icontains=truck)
    if customer:
        orders = orders.filter(customer__name__icontains=customer)
    if status_name:
        orders = orders.filter(current_status__name__iexact=status_name)
    if category:
        orders = orders.filter(category_id=category)

    # if start_date:
    #     orders = orders.filter(loading_start_date__gte=start_date)
    # if end_date:
    #     orders = orders.filter(loading_start_date__lte=end_date)

    paginator = OrderPagination()
    page = paginator.paginate_queryset(orders, request)

    serialized_orders = []
    for order in page:
        sorted_tasks = sorted(
            order.tasks.all(),
            key=lambda task: (
                datetime.strptime(task.start_date, "%Y-%m-%d")
                if isinstance(task.start_date, str)
                else task.start_date,
                datetime.strptime(task.start_time, "%H:%M:%S")
                if isinstance(task.start_time, str)
                else task.start_time,
            ),
        )
        order_data = OrderSerializer(order, context={'request': request}).data
        order_data["tasks"] = TaskSerializer(sorted_tasks, many=True, context={'request': request}).data
        serialized_orders.append(order_data)

    return paginator.get_paginated_response(serialized_orders)


@api_view(['GET'])
def searchOrderByNumber(request):
    order_number = request.query_params.get('order_number')
    print("Order Number", order_number)
    if not order_number:
        return Response({"error": "Missing order_number parameter"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = Order.objects.get(order_number=order_number, client=request.user.client)
        serializer = OrderSerializer(order, context={'request': request})
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

# @api_view(["GET"])
# def getOrders(request):
#     # Fetch orders with prefetch_related for optimization
#     orders = Order.objects.prefetch_related("tasks").all()

#     # Prepare a list for serialized orders
#     serialized_orders = []

#     # Sorting tasks within each order and serialize
#     for order in orders:
#         # Ensure tasks are sorted; parse strings to datetime if necessary
#         sorted_tasks = sorted(
#             order.tasks.all(),
#             key=lambda task: (
#                 datetime.strptime(task.start_date, "%Y-%m-%d")
#                 if isinstance(task.start_date, str)
#                 else task.start_date,
#                 datetime.strptime(task.start_time, "%H:%M:%S")
#                 if isinstance(task.start_time, str)
#                 else task.start_time,
#             ),
#         )

#         # Use a modified order object or a dictionary to hold sorted tasks
#         order_data = OrderSerializer(order).data
#         order_data["tasks"] = TaskSerializer(sorted_tasks, many=True).data

#         serialized_orders.append(order_data)

#     return Response(serialized_orders)


@api_view(["GET"])
def getOrder(request, pk):
    # `pk` may be the numeric order id or the human-readable route number (e.g. "1-06-26")
    lookup = {"id": pk} if str(pk).isdigit() else {"number": pk}
    try:
        order = Order.objects.prefetch_related("tasks").get(
            **lookup, client=request.user.client
        )
    except Order.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    # Sorting tasks within the order; parse strings to datetime if necessary
    sorted_tasks = sorted(
        order.tasks.all(),
        key=lambda task: (
            datetime.strptime(task.start_date, "%Y-%m-%d")
            if isinstance(task.start_date, str)
            else task.start_date,
            datetime.strptime(task.start_time, "%H:%M:%S")
            if isinstance(task.start_time, str)
            else task.start_time,
        ),
    )

    # Serialize order and manually insert serialized, sorted tasks
    order_data = OrderSerializer(order, context={'request': request}).data
    order_data["tasks"] = TaskSerializer(sorted_tasks, many=True, context={'request': request}).data

    return Response(order_data)


@api_view(["POST"])
def createOrder(request):
    data = request.data
    user_id = data.get("user")
    customer_name = data.get("customer")
    customer_manager_name = data.get("customer_manager")
    truck_plates = data.get("truck")
    driver_name = data.get("driver")
    platform_name = data.get("platform")
    payment_type_name = data.get("payment_type")
    currency_name = data.get("currency")

    user = Profile.objects.get(id=user_id) if user_id else None
    platform = Platform.objects.filter(name=platform_name, client=request.user.client).first() if platform_name else None
    payment_type = PaymentType.objects.filter(name=payment_type_name, client=request.user.client).first() if payment_type_name else None
    currency = Currency.objects.filter(short_name=currency_name, client=request.user.client).first() if currency_name else None
    customer = (
        Customer.objects.filter(name=customer_name, client=request.user.client).first() if customer_name else None
    )
    customer_manager = (
        CustomerManager.objects.filter(full_name=customer_manager_name, client=request.user.client).first()
        if customer_manager_name
        else None
    )

    truck = Truck.objects.filter(plates=truck_plates, client=request.user.client).first() if truck_plates else None
    driver = (
        DriverProfile.objects.filter(full_name=driver_name, client=request.user.client).first() if driver_name else None
    )

    data["user"] = user
    data["platform"] = platform
    data["payment_type"] = payment_type
    data["currency"] = currency
    data["customer"] = customer
    data["customer_manager"] = customer_manager
    data["truck"] = truck
    data["driver"] = driver
    data["client"] = request.user.client

    # order = Order(customer=customer, customer_manager=customer_manager, truck=truck, driver=driver, **data)
    order = Order(**data)
    order.save()

    serializer = OrderSerializer(order, many=False, context={'request': request})
    return Response(serializer.data)


@api_view(["PUT"])
def editOrder(request, pk):
    order = get_object_or_404(Order, id=pk, client=request.user.client)
    data = request.data.copy()

    print("Processed Data: ", data)

    # Serialize and validate the data
    serializer = OrderSerializer(instance=order, data=data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        print("Serializer Data: ", serializer.data)
        return Response(serializer.data)
    else:
        print("Serializer Errors: ", serializer.errors)
        return Response(serializer.errors, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def orderStats(request):
    """Return status counts and top-10 customers for the current client's orders."""
    qs = Order.objects.filter(client=request.user.client)

    status_counts = (
        qs.values("current_status__name")
        .annotate(count=Count("id"))
        .order_by("current_status__name")
    )

    top_customers = (
        qs.exclude(customer__isnull=True)
        .values("customer__name")
        .annotate(count=Count("id"))
        .order_by("-count")[:10]
    )

    category_counts = (
        qs.exclude(category__isnull=True)
        .values("category_id", "category__ukr")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    return Response({
        "statuses": [
            {"name": s["current_status__name"] or "unknown", "count": s["count"]}
            for s in status_counts
        ],
        "top_customers": [
            {"name": c["customer__name"], "count": c["count"]}
            for c in top_customers
        ],
        "categories": [
            {"id": c["category_id"], "name": c["category__ukr"], "count": c["count"]}
            for c in category_counts
        ],
    })


@api_view(["DELETE"])
def deleteOrder(request, pk):
    try:
        order = Order.objects.get(id=pk, client=request.user.client)
    except Order.DoesNotExist:
        message = {"detail": "Order does not exist"}
        return Response(message, status=status.HTTP_404_NOT_FOUND)

    serializer = OrderSerializer(order, many=False, context={'request': request})
    orderData = serializer.data

    order.delete()

    # Optionally return the data of the deleted order
    message = {"detail": "Order deleted successfully", "data": orderData}
    return Response(message)

