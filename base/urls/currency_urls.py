from django.contrib import admin
from django.urls import path
from base.views import currency_views as views


urlpatterns = [
    path("", views.getCurrencies, name="currencies"),
    ]
