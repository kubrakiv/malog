from django.contrib import admin
from django.urls import path
from base.views import customer_manager_views as views

urlpatterns = [
    path("", views.getCustomerManagers, name="customer-managers"),
    path("create/", views.createCustomerManager, name="customer-manager-create"),
    path("delete/<str:pk>/", views.deleteCustomerManager, name="customer-manager-delete"),
    path("update/<str:pk>/", views.updateCustomerManager, name="customer-manager-update"),
]
