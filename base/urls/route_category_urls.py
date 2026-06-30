from django.urls import path
from base.views import route_category_views as views

urlpatterns = [
    path("", views.listRouteCategories, name="route-categories-list"),
    path("create/", views.createRouteCategory, name="route-category-create"),
    path("<int:pk>/", views.routeCategoryDetail, name="route-category-detail"),
]
