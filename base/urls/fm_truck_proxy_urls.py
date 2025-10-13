from django.urls import path
from base.views import fm_truck_proxy_views as views


urlpatterns = [
    path("<str:driver_id>/", views.get_tacho_data, name="tacho-data")
]
