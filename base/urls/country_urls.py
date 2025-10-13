from django.contrib import admin
from django.urls import path
from base.views import country_views as views

urlpatterns = [
    path("", views.getCountries, name="countries"),
]
