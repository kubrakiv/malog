from django.urls import path
from user.views import admin_views

urlpatterns = [
    path('pending-clients/', admin_views.list_pending_clients, name='list_pending_clients'),
    path('approve-client/<int:client_id>/', admin_views.approve_client, name='approve_client'),
    path('reject-client/<int:client_id>/', admin_views.reject_client, name='reject_client'),
]