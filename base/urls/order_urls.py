from django.contrib import admin
from django.urls import path
from base.views import order_views as views


urlpatterns = [
    path("", views.getOrders, name="orders"),
    path("create/", views.createOrder, name="order-create"),
    path('search/', views.searchOrderByNumber, name='search-order'),
    path("<str:pk>/", views.getOrder, name="order"),
    path("edit/<str:pk>/", views.editOrder, name="order-edit"),
    path("delete/<str:pk>/", views.deleteOrder, name="order-delete"),
]
