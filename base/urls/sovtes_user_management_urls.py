"""
URLs for Sovtes User Management (Admin)
"""

from django.urls import path
from base.views.sovtes_user_management_views import (
    list_sovtes_users,
    reset_sovtes_user_password,
    disable_sovtes_user_password,
    sovtes_user_info
)

urlpatterns = [
    # Admin only endpoints for managing Sovtes users
    path('users/', list_sovtes_users, name='list_sovtes_users'),
    path('users/<int:user_id>/', sovtes_user_info, name='sovtes_user_info'),
    path('users/<int:user_id>/reset-password/', reset_sovtes_user_password, name='reset_sovtes_user_password'),
    path('users/<int:user_id>/disable-password/', disable_sovtes_user_password, name='disable_sovtes_user_password'),
]