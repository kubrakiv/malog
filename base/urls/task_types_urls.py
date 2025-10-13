from django.contrib import admin
from django.urls import path
from base.views import task_types_views as views


urlpatterns = [
    path("", views.getTaskTypes, name="task-types"),
]
