from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from base.models import Order, OrderStatus, OrderStatusHistory
from base.serializers import OrderStatusHistorySerializer
from base.services.cost_snapshot import snapshot_order_costs


@api_view(['POST'])
def updateOrderStatus(request, order_id):
    print("Order Status Data: ", request.data)
    try:
        order = Order.objects.get(pk=order_id, client=request.user.client)
        new_status_id = request.data.get("status_id")

        if not new_status_id:
            return Response({"error": "Status ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        new_status = OrderStatus.objects.get(pk=new_status_id, client=request.user.client)

        print(f"Old Status: {order.current_status}")
        print(f"New Status ID: {new_status_id}, Name: {new_status.name}")

        order.set_status(new_status)

        if new_status.is_terminal:
            try:
                snapshot_order_costs(order)
            except Exception as e:
                print(f"Warning: cost snapshot failed for order {order.id}: {e}")

        return Response({"message": f"Order status updated to '{new_status.name}' successfully."}, status=status.HTTP_200_OK)
    except Order.DoesNotExist:
        return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
    except OrderStatus.DoesNotExist:
        return Response({"error": "Invalid status ID."}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def recalculateOrderCosts(request, order_id):
    """Manually trigger a cost snapshot for an order."""
    try:
        order = Order.objects.get(pk=order_id, client=request.user.client)
        snapshot_order_costs(order)
        return Response({
            "message": "Costs recalculated and saved.",
            "cost_snapshot": order.cost_snapshot,
            "cost_snapshot_at": order.cost_snapshot_at,
        }, status=status.HTTP_200_OK)
    except Order.DoesNotExist:
        return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def getOrderStatusHistory(request, order_id):
    """
    Get the status history of an order.
    """
    try:
        history = OrderStatusHistory.objects.filter(order_id=order_id, order__client=request.user.client).order_by("-started_at")
        if not history.exists():
            return Response(
                {"message": "No status history found for this order."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = OrderStatusHistorySerializer(history, many=True, context={'request': request})
        return Response(serializer.data)

    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    except Exception as e:
        return Response(
            {"error": "An error occurred while fetching the status history."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
