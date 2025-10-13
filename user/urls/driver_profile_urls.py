from django.contrib import admin
from django.urls import path
from user.views import driver_profile_views as views


urlpatterns = [
    path("", views.getDriverProfiles, name="driver-profiles"),
    path("upload/", views.uploadDriverImage, name="driver-profile-image-upload"),
    path("<str:pk>/", views.getDriverProfile, name="driver-profile"),
    path("update/<str:pk>/", views.updateDriverProfile, name="driver-profile-update"),
    path("delete/<str:pk>/", views.deleteDriverProfile, name="driver-profile-delete"),
]