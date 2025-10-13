from django.urls import path
from base.views.sovtes_views import sovtes_jwt_login, verify_sovtes_token

urlpatterns = [
    path('login/', sovtes_jwt_login, name='sovtes-jwt-login'),
    path('verify/', verify_sovtes_token, name='sovtes-token-verify'),
]