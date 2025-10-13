from django.contrib import admin
from django.urls import path
from user.views import role_views as views


urlpatterns = [
    path("", views.getRoles, name="roles"),
]