from django.urls import path
from base.views import sovtes_fleet_views as views

urlpatterns = [
    path("fleet/trucks/", views.getSovtesTrucks, name="sovtes-fleet-trucks"),
    path("fleet/trailers/", views.getSovtesTrailers, name="sovtes-fleet-trailers"),
    path("fleet/sync-truck/", views.syncSovtesTruck, name="sovtes-sync-truck"),
    path("fleet/sync-trailer/", views.syncSovtesTrailer, name="sovtes-sync-trailer"),
    path("fleet/resync-truck/", views.resyncSovtesTruck, name="sovtes-resync-truck"),
    path("fleet/resync-trailer/", views.resyncSovtesTrailer, name="sovtes-resync-trailer"),
    path("fleet/link-truck/", views.linkSovtesTruck, name="sovtes-link-truck"),
    path("fleet/link-trailer/", views.linkSovtesTrailer, name="sovtes-link-trailer"),
    path("fleet/resync-all-trucks/", views.resyncAllSovtesTrucks, name="sovtes-resync-all-trucks"),
    path("fleet/resync-all-trailers/", views.resyncAllSovtesTrailers, name="sovtes-resync-all-trailers"),
    # Drivers
    path("fleet/drivers/", views.getSovtesDrivers, name="sovtes-fleet-drivers"),
    path("fleet/sync-driver/", views.syncSovtesDriver, name="sovtes-sync-driver"),
    path("fleet/resync-driver/", views.resyncSovtesDriver, name="sovtes-resync-driver"),
    path("fleet/link-driver/", views.linkSovtesDriver, name="sovtes-link-driver"),
    path("fleet/resync-all-drivers/", views.resyncAllSovtesDrivers, name="sovtes-resync-all-drivers"),
]
