from django.urls import path
from base.views import sovtes_tenders_views as views

urlpatterns = [
    path("tender-groups/", views.getTenderGroups, name="get-tender-groups"),
    path("current-tenders/", views.getCurrentTenders, name="get-current-tenders"),
    path("my-tenders/", views.getMyTenders, name="get-my-tenders"),
    path("basic-details/", views.getBasicDetailsOfRoutes, name="get-basic-details"),
    path("not-interested/", views.notInterestedView, name="not-interested"),
    path("complete-routes/", views.getCompleteRoutes, name="get-complete-routes"),
    path("tender-steps/", views.getTenderSteps, name="get-tender-steps"),
    path("bookmark/", views.bookmarkView, name="bookmark"),
    path("cancel-pricequote/", views.cancelPricequoteView, name="cancel-pricequote"),
    path("revive-pricequote/", views.revivePricequoteView, name="revive-pricequote"),
    path("pricequotes/", views.getPricequotesView, name="get-pricequotes"),
    path("offer-price/", views.offerPriceQuote, name="offer-price-quote"),
    # Real-time updates
    path("webhook/", views.sovtes_webhook_receiver, name="sovtes-webhook"),
    path("events/", views.sovtes_sse_stream, name="sovtes-sse"),
    path("register-webhook/", views.registerWebhookView, name="register-webhook"),
]
