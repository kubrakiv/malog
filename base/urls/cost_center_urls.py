from django.urls import path
from base.views import cost_center_views as views

urlpatterns = [
    path("", views.listCostCenters, name="cost-centers-list"),
    path("create/", views.createCostCenter, name="cost-center-create"),
    path("assumed-km/", views.updateAssumedKm, name="cost-center-assumed-km"),
    path("<int:pk>/", views.costCenterDetail, name="cost-center-detail"),
]
