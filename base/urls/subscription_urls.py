from django.urls import path
from base.views import subscription_views as views

urlpatterns = [
    path('plans/', views.get_subscription_plans, name='subscription-plans'),
    path('current/', views.get_client_subscription, name='client-subscription'),
    path('history/', views.get_subscription_history, name='subscription-history'),
    path('create/', views.create_subscription, name='create-subscription'),
    path('upgrade/', views.upgrade_subscription, name='upgrade-subscription'),
    path('change-plan/', views.change_subscription_plan, name='change-subscription-plan'),
    path('cancel/', views.cancel_subscription, name='cancel-subscription'),
    path('check-feature/<str:feature_name>/', views.check_feature_access, name='check-feature-access'),
    path('check-truck-limit/', views.check_truck_limit, name='check-truck-limit'),
    path('check-driver-limit/', views.check_driver_limit, name='check-driver-limit'),
    
    # Plan change request management
    path('change-requests/', views.get_plan_change_requests, name='plan-change-requests'),
    path('change-requests/my/', views.get_my_plan_change_requests, name='my-plan-change-requests'),
    path('change-requests/<int:request_id>/approve/', views.approve_plan_change_request, name='approve-plan-change'),
    path('change-requests/<int:request_id>/reject/', views.reject_plan_change_request, name='reject-plan-change'),
    
    # Admin endpoints for plan management
    path('admin/plans/', views.admin_subscription_plans, name='admin-subscription-plans'),
    path('admin/plans/<int:plan_id>/', views.admin_subscription_plan_detail, name='admin-subscription-plan-detail'),
    
    # Admin endpoints for client subscription management
    path('admin/client-subscriptions/', views.admin_client_subscriptions, name='admin-client-subscriptions'),
    path('admin/client-subscriptions/<int:subscription_id>/', views.admin_client_subscription_detail, name='admin-client-subscription-detail'),
    
    # Trial-specific endpoints
    path('trial/start/', views.start_trial, name='start-trial'),
    path('trial/convert/', views.convert_trial_to_paid, name='convert-trial-to-paid'),
    path('trial/extend/', views.extend_trial, name='extend-trial'),
    path('trial/status/', views.get_trial_status, name='trial-status'),
]