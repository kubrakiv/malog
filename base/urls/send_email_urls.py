from django.urls import path
from base.views import send_email_views as views


urlpatterns = [
    path("", views.send_email, name="send-email"),
]