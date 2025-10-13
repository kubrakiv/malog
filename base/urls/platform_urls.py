from django.contrib import admin
from django.urls import path
from base.views import platform_views as views


urlpatterns = [
    path("", views.getPlatforms, name="platforms"),
    path("<str:pk>/", views.getPlatform, name="platform"),
]
