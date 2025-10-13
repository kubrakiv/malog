from django.contrib import admin
from django.urls import path
from base.views import task_views as views


urlpatterns = [
    path("", views.getTasks, name="tasks"),
    path("create/", views.createTask, name="task-create"),
    path("<str:pk>/", views.getTask, name="task"),
    path("edit/<str:pk>/", views.editTask, name="task-edit"),
    path("delete/<str:pk>/", views.deleteTask, name="task-delete"),
]
