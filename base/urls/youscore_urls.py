"""
YouScore API URL Configuration
"""

from django.urls import path
from base.views.youscore_views import (
    get_company_info,
    get_usr_info,
    get_vehicle_check,
    get_vehicles_owned,
    health_check,
    lookup_company_for_registration,
)

urlpatterns = [
    # Company info by contractor code
    path('companyInfo/<str:natcomid>', get_company_info, name='youscore-company-info'),

    # FOP info by contractor code
    path('usr/<str:natcomid>', get_usr_info, name='youscore-usr-info'),

    # Main endpoint to fetch vehicles owned by contractor
    path('vehicles/owned', get_vehicles_owned, name='youscore-vehicles-owned'),

    # Vehicle check by number
    path('vehicles/check', get_vehicle_check, name='youscore-vehicle-check'),
    
    # Public registration lookup (no X-API-Key required)
    path('register/company-lookup/<str:edrpou>', lookup_company_for_registration, name='youscore-reg-company-lookup'),

    # Health check endpoint
    path('health', health_check, name='youscore-health-check'),
]
