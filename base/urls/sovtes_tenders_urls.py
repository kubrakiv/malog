from django.urls import path
from base.views import sovtes_tenders_views as views

urlpatterns = [
    path("tender-groups/", views.getTenderGroups, name="get-tender-groups"),
    path("current-tenders/", views.getCurrentTenders, name="get-current-tenders"),
    path("my-tenders/", views.getMyTenders, name="get-my-tenders"),
    path("basic-details/", views.getBasicDetailsOfRoutes, name="get-basic-details"),
    path("not-interested/", views.notInterestedView, name="not-interested"),
    path("complete-routes/", views.getCompleteRoutes, name="get-complete-routes"),
    path("single-route/", views.singleRouteView, name="single-route"),
    path("tender-children/", views.getTenderChildrenView, name="tender-children"),
    path("route-actions/", views.getRouteActionsView, name="route-actions"),
    path("tender-steps/", views.getTenderSteps, name="get-tender-steps"),
    path("bookmark/", views.bookmarkView, name="bookmark"),
    path("cancel-pricequote/", views.cancelPricequoteView, name="cancel-pricequote"),
    path("revive-pricequote/", views.revivePricequoteView, name="revive-pricequote"),
    path("pricequotes/", views.getPricequotesView, name="get-pricequotes"),
    path("my-drivers/", views.getMyDriversView, name="my-drivers"),
    path("my-cars/", views.getMyCarsView, name="my-cars"),
    path("my-trailers/", views.getMyTrailersView, name="my-trailers"),
    path("offer-auto/", views.offerAutoView, name="offer-auto"),
    path("subscribe-route/", views.subscribeRouteView, name="subscribe-route"),
    path("offer-price/", views.offerPriceQuote, name="offer-price-quote"),
    # Real-time updates
    path("webhook/", views.sovtes_webhook_receiver, name="sovtes-webhook"),
    path("events/", views.sovtes_sse_stream, name="sovtes-sse"),
    path("pusher-config/", views.pusherConfigView, name="pusher-config"),
    path("pusher-auth/", views.pusherAuthView, name="pusher-auth"),
]
