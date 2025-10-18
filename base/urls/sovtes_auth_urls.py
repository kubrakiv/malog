from django.urls import path
from base.views.sovtes_views import sovtes_jwt_login, verify_sovtes_token
from base.views.sovtes_redirect_views import sovtes_redirect_auth, sovtes_auth_status

urlpatterns = [
    path('login/', sovtes_jwt_login, name='sovtes-jwt-login'),
    path('verify/', verify_sovtes_token, name='sovtes-token-verify'),
    
    # Redirect endpoint for direct integration
    path('redirect/', sovtes_redirect_auth, name='sovtes-redirect-auth'),
    path('status/', sovtes_auth_status, name='sovtes-auth-status'),
]