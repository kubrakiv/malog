from django.contrib import admin
from django.urls import path
from base.views import company_views as views


urlpatterns = [
    path("", views.getCompany, name="company"),
    ]
