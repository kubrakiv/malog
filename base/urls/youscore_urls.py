"""
YouScore API URL Configuration
"""

from django.urls import path
from base.views.youscore_views import get_vehicles_owned, health_check

urlpatterns = [
    # Main endpoint to fetch vehicles owned by contractor
    path('vehicles/owned', get_vehicles_owned, name='youscore-vehicles-owned'),
    
    # Health check endpoint
    path('health', health_check, name='youscore-health-check'),
]
