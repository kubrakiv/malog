from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import RouteCalculation, RouteToll, RoutePoint, TruckParameters
from .serializers import (
    RouteCalculationSerializer, 
    RouteCalculationCreateSerializer,
    RouteTollSerializer,
    RoutePointSerializer,
    TruckParametersSerializer
)


class RouteCalculationListCreateView(generics.ListCreateAPIView):
    """List and create route calculations"""
    queryset = RouteCalculation.objects.all()
    serializer_class = RouteCalculationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by user if not admin"""
        if self.request.user.is_staff:
            return RouteCalculation.objects.all()
        return RouteCalculation.objects.filter(calculated_by=self.request.user)


class RouteCalculationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a route calculation"""
    queryset = RouteCalculation.objects.all()
    serializer_class = RouteCalculationSerializer
    permission_classes = [IsAuthenticated]


@api_view(['POST'])
@permission_classes([])  # Remove authentication requirement for now
def create_route_from_calculator(request):
    """
    Create route calculation from CalculatorPage data
    Expected payload:
    {
        "carrier": "Company Name",
        "customer": "Customer Name", 
        "price": 1500.00,
        "currency": "EUR",
        "route_info": {
            "distance": "1001",
            "duration": "12.72",
            "emptyDistance": "17",
            "tollData": {
                "totalEUR": "729.44",
                "byCountry": [...]
            },
            "countryData": [...]
        },
        "points_data": [
            {
                "lat": 49.7477415,
                "lng": 13.3775249,
                "type": "Start",
                "label": "Pilsen CZ"
            },
            ...
        ]
    }
    """
    serializer = RouteCalculationCreateSerializer(
        data=request.data, 
        context={'request': request}
    )
    
    if serializer.is_valid():
        route_calculation = serializer.save()
        response_serializer = RouteCalculationSerializer(route_calculation)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def route_calculation_stats(request):
    """Get statistics for route calculations"""
    user_calculations = RouteCalculation.objects.filter(calculated_by=request.user)
    
    stats = {
        'total_calculations': user_calculations.count(),
        'total_distance_km': sum(
            calc.loaded_distance_km + calc.empty_distance_km 
            for calc in user_calculations
        ),
        'total_toll_cost': sum(calc.toll_cost for calc in user_calculations),
        'average_duration_h': (
            sum(calc.total_duration_h for calc in user_calculations) / 
            user_calculations.count() if user_calculations.count() > 0 else 0
        ),
        'recent_calculations': RouteCalculationSerializer(
            user_calculations[:5], many=True
        ).data
    }
    
    return Response(stats)


class RouteTollListView(generics.ListAPIView):
    """List tolls for a specific route calculation"""
    serializer_class = RouteTollSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        route_id = self.kwargs['route_id']
        route = get_object_or_404(RouteCalculation, id=route_id)
        return RouteToll.objects.filter(route=route)


class RoutePointListView(generics.ListAPIView):
    """List points for a specific route calculation"""
    serializer_class = RoutePointSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        route_id = self.kwargs['route_id']
        route = get_object_or_404(RouteCalculation, id=route_id)
        return RoutePoint.objects.filter(route=route).order_by('order')


@api_view(['PATCH'])
@permission_classes([])  # No authentication required for now
def update_route_price(request, pk):
    """Update route price and recalculate profit/margin"""
    try:
        route = RouteCalculation.objects.get(pk=pk)
    except RouteCalculation.DoesNotExist:
        return Response({'error': 'Route not found'}, status=status.HTTP_404_NOT_FOUND)
    
    new_price = request.data.get('price')
    if new_price is None:
        return Response({'error': 'Price is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        new_price = float(new_price)
        if new_price < 0:
            return Response({'error': 'Price must be positive'}, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid price format'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Update the price
    route.price = new_price
    route.save()  # This will trigger the save method to recalculate profit/margin
    
    serializer = RouteCalculationSerializer(route)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([])  # No authentication required for now
def delete_route(request, pk):
    """Delete a route calculation"""
    try:
        route = RouteCalculation.objects.get(pk=pk)
    except RouteCalculation.DoesNotExist:
        return Response({'error': 'Route not found'}, status=status.HTTP_404_NOT_FOUND)
    
    route.delete()
    return Response({'message': 'Route deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([])  # No authentication required for now
def list_route_calculations(request):
    """Get list of last 20 route calculations"""
    calculations = RouteCalculation.objects.all().order_by('-created_at')[:20]
    serializer = RouteCalculationSerializer(calculations, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([])  # No authentication required for now
def list_truck_parameters(request):
    """Get list of available truck parameters"""
    truck_params = TruckParameters.objects.all().order_by('weight_capacity', 'truck_type')
    serializer = TruckParametersSerializer(truck_params, many=True)
    return Response(serializer.data)