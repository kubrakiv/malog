from django.contrib import admin
from django.urls import path
from base.views import point_views as views


urlpatterns = [
    path("", views.getPoints, name="points"),
    path("create/", views.createPoint, name="point-create"),
    path("<str:pk>/", views.getPoint, name="point"),
    path("edit/<str:pk>/", views.editPoint, name="point-edit"),
    path("delete/<str:pk>/", views.deletePoint, name="point-delete"),
]
