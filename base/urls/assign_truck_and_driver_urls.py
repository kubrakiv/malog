from django.urls import path
from base.views import assign_truck_and_driver_views as views


urlpatterns = [
    path("", views.assign_truck_and_driver, name="assign-truck-and-driver")
]
