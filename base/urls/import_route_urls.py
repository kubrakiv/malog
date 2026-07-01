from django.urls import path
from base.views import import_route_views as views


urlpatterns = [
    path("route-preview/", views.preview_route, name="preview-route-data"),
    path("routes/", views.fetch_and_create_orders, name="fetch-route-data"),
    path("create-route/", views.create_route, name="create-route"),
    path("booked-tender-routes/", views.get_booked_tender_routes, name="get-booked-tender-routes")

]
