from django.urls import path
from base.views import ruptela_views as views

urlpatterns = [
    path("objects/<str:object_id>/trips", views.get_ruptela_trips),
]