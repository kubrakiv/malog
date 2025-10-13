from django.contrib import admin
from django.urls import path
from base.views import invoice_views as views

urlpatterns = [
    path("", views.getInvoices, name="invoices"),
    path("create/", views.createInvoice, name="invoice-create"),
    path("<str:pk>/", views.getInvoice, name="invoice"),
    path("update/<str:pk>/", views.updateInvoice, name="invoice-update"),
    path("update/<str:pk>/payment-date/", views.updateInvoiceDueDate, name="invoice-update-payment-date"),
    path("delete/<str:pk>/", views.deleteInvoice, name="invoice-delete"),
]