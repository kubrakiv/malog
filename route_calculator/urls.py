from django.urls import path
from . import views

app_name = 'route_calculator'

urlpatterns = [
    # Route calculations
    path('calculations/', views.RouteCalculationListCreateView.as_view(), name='calculation-list-create'),
    path('calculations/list/', views.list_route_calculations, name='calculation-list'),
    path('calculations/<int:pk>/', views.RouteCalculationDetailView.as_view(), name='calculation-detail'),
    path('calculations/<int:pk>/update-price/', views.update_route_price, name='update-route-price'),
    path('calculations/<int:pk>/delete/', views.delete_route, name='delete-route'),
    path('calculations/create-from-calculator/', views.create_route_from_calculator, name='create-from-calculator'),
    path('calculations/stats/', views.route_calculation_stats, name='calculation-stats'),
    
    # Route tolls
    path('calculations/<int:route_id>/tolls/', views.RouteTollListView.as_view(), name='route-tolls'),
    
    # Route points
    path('calculations/<int:route_id>/points/', views.RoutePointListView.as_view(), name='route-points'),
    
    # Truck parameters
    path('truck-parameters/', views.list_truck_parameters, name='truck-parameters'),

    # Cost configuration
    path('fuel-prices/current/', views.current_fuel_prices, name='fuel-prices-current'),
    path('cost-config/', views.cost_config, name='cost-config'),
]
