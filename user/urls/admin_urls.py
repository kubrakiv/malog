from django.urls import path
from user.views import admin_views

urlpatterns = [
    path('dashboard-stats/', admin_views.dashboard_stats, name='dashboard_stats'),
    path('external-identities/', admin_views.list_client_external_identities, name='list_client_external_identities'),
    path('external-identities/<int:identity_id>/link/', admin_views.link_client_external_identity, name='link_client_external_identity'),
    path('external-identities/<int:identity_id>/reset/', admin_views.reset_client_external_identity, name='reset_client_external_identity'),
    path('pending-clients/', admin_views.list_pending_clients, name='list_pending_clients'),
    path('approve-client/<int:client_id>/', admin_views.approve_client, name='approve_client'),
    path('reject-client/<int:client_id>/', admin_views.reject_client, name='reject_client'),
]