"""
URL patterns for onboarding workflow
"""
from django.urls import path
from base.views.onboarding_views import (
    onboarding_status,
    complete_onboarding,
    skip_onboarding,
    complete_planner_tutorial,
    reset_onboarding,
)

urlpatterns = [
    path('status/', onboarding_status, name='onboarding_status'),
    path('complete/', complete_onboarding, name='complete_onboarding'),
    path('skip/', skip_onboarding, name='skip_onboarding'),
    path('tutorial/complete/', complete_planner_tutorial, name='complete_planner_tutorial'),
    path('reset/', reset_onboarding, name='reset_onboarding'),
]
