"""
Sample views demonstrating tenant isolation
"""
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Client, Company, Customer, Order, Truck
from .serializers import ClientSerializer, CompanySerializer, CustomerSerializer, OrderSerializer, TruckSerializer
from .tenant import get_current_client


class TenantViewMixin:
    """
    Mixin for tenant-aware views
    """
    def get_queryset(self):
        """
        Override to ensure tenant isolation
        """
        queryset = super().get_queryset()
        client = get_current_client()
        
        if client and hasattr(queryset.model, 'client'):
            return queryset.filter(client=client)
        return queryset

    def perform_create(self, serializer):
        """
        Auto-assign current client when creating objects
        """
        client = get_current_client()
        if client and hasattr(serializer.Meta.model, 'client'):
            serializer.save(client=client)
        else:
            serializer.save()


class ClientViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for clients - only superusers can see all clients
    Regular users can only see their own client
    """
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Client.objects.all()
        elif hasattr(self.request.user, 'client') and self.request.user.client:
            return Client.objects.filter(id=self.request.user.client.id)
        else:
            return Client.objects.none()

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """
        Get statistics for a client
        """
        client = self.get_object()
        from .utils import get_client_statistics
        
        try:
            stats = get_client_statistics(client)
            return Response(stats)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CompanyViewSet(TenantViewMixin, viewsets.ModelViewSet):
    """
    ViewSet for companies - automatically filtered by tenant
    """
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Company.objects.all()


class CustomerViewSet(TenantViewMixin, viewsets.ModelViewSet):
    """
    ViewSet for customers - automatically filtered by tenant
    """
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Customer.objects.all()


class TruckViewSet(TenantViewMixin, viewsets.ModelViewSet):
    """
    ViewSet for trucks - automatically filtered by tenant
    """
    serializer_class = TruckSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Truck.objects.all()


class OrderViewSet(TenantViewMixin, viewsets.ModelViewSet):
    """
    ViewSet for orders - automatically filtered by tenant
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Order.objects.all()

    @action(detail=False, methods=['get'])
    def current_client_orders(self, request):
        """
        Get orders for the current client
        """
        client = get_current_client()
        if not client:
            return Response(
                {'error': 'No client associated with user'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        orders = Order.objects.filter(client=client)
        serializer = self.get_serializer(orders, many=True)
        return Response({
            'client': client.name,
            'orders_count': orders.count(),
            'orders': serializer.data
        })