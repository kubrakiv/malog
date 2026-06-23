from django.urls import path
from base.views import truck_unit_views as views

urlpatterns = [
    path("", views.listTruckUnits, name="truck-units-list"),
    path("create/", views.createTruckUnit, name="truck-units-create"),
    path("delete/<int:pk>/", views.deleteTruckUnit, name="truck-units-delete"),
    path("assign/", views.assignTruckUnit, name="truck-units-assign"),
    path("history/<int:truck_id>/", views.truckUnitHistory, name="truck-units-history"),
    path("assign-driver/", views.assignDriverUnit, name="truck-units-assign-driver"),
    path("driver-history/<int:driver_id>/", views.driverUnitHistory, name="truck-units-driver-history"),
]
