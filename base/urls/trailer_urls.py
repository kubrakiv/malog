from django.contrib import admin
from django.urls import path
from base.views import trailer_views as views


urlpatterns = [
    path("", views.getTrailers, name="trailers"),
    path("create/", views.createTrailer, name="create-trailer"),
    path("delete/<str:pk>/", views.deleteTrailer, name="delete-trailer"),
    path("update/<int:pk>/", views.updateTrailer, name="update-trailer"),
]
