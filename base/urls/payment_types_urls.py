from django.contrib import admin
from django.urls import path
from base.views import payment_types_views as views


urlpatterns = [
    path("", views.getPaymentTypes, name="payment-types"),
    path("<str:pk>/", views.getPaymentType, name="payment-type"),
]
