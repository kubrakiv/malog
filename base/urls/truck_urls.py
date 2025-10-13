from django.contrib import admin
from django.urls import path
from base.views import truck_views as views


urlpatterns = [
    path("", views.getTrucks, name="trucks"),
    path("create/", views.createTruck, name="create-truck"),
    path("delete/<str:pk>/", views.deleteTruck, name="delete-truck"),
    path("update/<int:pk>/", views.updateTruck, name="update-truck"),
    path("update-trailer-driver/<int:pk>/", views.updateTruckTrailerAndDriver, name="update-truck-trailer-driver"),
]
