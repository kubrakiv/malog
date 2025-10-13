from django.contrib import admin
from django.urls import path
from base.views import file_types_views as views


urlpatterns = [
    path("", views.getFileTypes, name="file-types"),
]
