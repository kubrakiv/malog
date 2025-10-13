from django.contrib import admin
from django.urls import path
from base.views import upload_documents_views as views


urlpatterns = [
    path("upload/", views.uploadDocuments, name="upload-documents"),
    path("<str:pk>/order/", views.getDocuments, name="documents"),
    path("<str:pk>/", views.getDocument, name="document"),
    path("delete/<str:pk>/", views.deleteDocument, name="delete-document"),
]
