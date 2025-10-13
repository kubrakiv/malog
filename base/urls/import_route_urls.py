from django.urls import path
from base.views import import_route_views as views


urlpatterns = [
    path("routes/", views.fetch_and_create_orders, name="fetch-route-data"),
    path("create-route/", views.create_route, name="create-route"),
    path("all-routes/", views.get_all_routes, name="get-all-routes")

]
