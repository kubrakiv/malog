from django.urls import path
from base.views import company_views as views

urlpatterns = [
    path("", views.getCompany, name="company"),
    path("update/", views.updateCompany, name="company-update"),
    path("banks/", views.listCreateBanks, name="company-banks"),
    path("banks/<int:bank_id>/", views.bankDetail, name="company-bank-detail"),
]
