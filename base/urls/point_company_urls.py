from django.contrib import admin
from django.urls import path
from base.views import point_company_views as views

urlpatterns = [
    path("", views.getPointCompanies, name="point-companies")
]
