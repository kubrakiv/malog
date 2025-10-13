from django.contrib import admin
from django.urls import path
from base.views import customer_views as views

urlpatterns = [
    path("", views.getCustomers, name="customers"),
    path("create/", views.createCustomer, name="customer-create"),
    path("update/<str:pk>/", views.updateCustomer, name="customer-update"),
    path("delete/<str:pk>/", views.deleteCustomer, name="customer-delete"),
]
