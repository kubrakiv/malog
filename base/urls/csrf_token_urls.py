from django.contrib import admin
from django.urls import path
from base.views import csrf_token_views as views


urlpatterns = [
    path("", views.get_csrf_token, name="get_csrf_token"),    
]
