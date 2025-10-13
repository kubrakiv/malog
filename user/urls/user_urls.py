from django.contrib import admin
from django.urls import path
from user.views import user_views as views
from user.views.registration_views import register_client


urlpatterns = [
    path("login/", views.MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("register/", views.registerUser, name="register"),
    path("register-client/", register_client, name="register-client"),
    path("profile/", views.getUserProfile, name="user-profile"),
    path("profile/update/", views.updateUserProfile, name="user-profile-update"),

    path("", views.getUsers, name="users"),

    path("<str:pk>/", views.getUserById, name="user"),
    path("update/<str:pk>/", views.updateUser, name="user-update"),
    path("delete/<str:pk>/", views.deleteUser, name="user-delete"),

]