from django.urls import path
from base.views import sovtes_tenders_views as views


urlpatterns = [
    path("single-route/<str:pk>/", views.getSingleRoute, name="get-single-route"),
    path("current-tenders/", views.getCurrentTenders, name="get-current-tenders"),
    path("offer-price/", views.offerPriceQuote, name="offer-price-quote"),
]
