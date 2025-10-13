from django.urls import path
from base.views.order_status_view import updateOrderStatus, getOrderStatusHistory

urlpatterns = [
    path('<int:order_id>/update-status/', updateOrderStatus, name='update-order-status'),
    path('<int:order_id>/status-history/', getOrderStatusHistory, name='get-order-status-history'),
]