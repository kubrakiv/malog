from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Profile,
    Role,
    AdminProfile,
    LogistProfile,
    DriverProfile,
    # CustomerProfile
)


class TenantUserAdmin(admin.ModelAdmin):
    """
    Base admin class for user-related models with tenant filtering
    """
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            # Superusers can see all profiles
            return qs
        elif hasattr(request.user, 'client') and request.user.client:
            # Regular users see only profiles from their client
            return qs.filter(profile__client=request.user.client)
        else:
            # Users without clients see nothing
            return qs.none()


# Register your models here.
admin.site.register(Role)

@admin.register(AdminProfile)
class AdminProfileAdmin(TenantUserAdmin):
    list_display = ['profile', 'phone_number', 'position']
    search_fields = ['profile__username', 'profile__email', 'position']

@admin.register(LogistProfile) 
class LogistProfileAdmin(TenantUserAdmin):
    list_display = ['profile', 'phone_number', 'position']
    search_fields = ['profile__username', 'profile__email', 'position']

@admin.register(DriverProfile)
class DriverProfileAdmin(TenantUserAdmin):
    list_display = ['profile', 'email', 'full_name', 'phone_number']
    search_fields = ['profile__username', 'profile__email', 'full_name']
    list_filter = ['profile__client']


class ProfileAdmin(UserAdmin):
    """
    Custom admin for Profile (User) model with tenant support
    """
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            # Superusers can see all profiles
            return qs
        elif hasattr(request.user, 'client') and request.user.client:
            # Regular users see only profiles from their client
            return qs.filter(client=request.user.client)
        else:
            # Users without clients see nothing
            return qs.none()

    def save_model(self, request, obj, form, change):
        if not change and hasattr(request.user, 'client') and request.user.client:
            # Auto-assign client for new users
            obj.client = request.user.client
        super().save_model(request, obj, form, change)

    # Update fieldsets to include client field
    fieldsets = list(UserAdmin.fieldsets)
    fieldsets[1] = ('Personal Info', {
        'fields': ('first_name', 'last_name', 'email', 'phone_number', 'role', 'client')
    })
    
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'role', 'client')
    list_filter = UserAdmin.list_filter + ('client', 'role')
    search_fields = UserAdmin.search_fields + ('client__name',)


admin.site.register(Profile, ProfileAdmin)


