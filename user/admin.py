from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin
from django.shortcuts import redirect, get_object_or_404
from django.urls import path, reverse
from django.utils.html import format_html
from .models import (
    Profile,
    Role,
    AdminProfile,
    LogistProfile,
    DriverProfile,
    UserSession,
    UserActivity,
    # CustomerProfile
)
from base.models import Company
from base.mailer import actions as mailer_actions


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
    readonly_fields = UserAdmin.readonly_fields + ('registration_password',)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:user_id>/reset-password/',
                self.admin_site.admin_view(self.reset_password_view),
                name='user_profile_reset_password',
            ),
            path(
                '<int:user_id>/send-welcome-email/',
                self.admin_site.admin_view(self.send_welcome_email_view),
                name='user_profile_send_welcome_email',
            ),
        ]
        return custom_urls + urls

    def has_password_reset_permission(self, request):
        return request.user.is_superuser or request.user.is_system_admin()

    def _reset_profile_password(self, profile):
        alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
        password = ''.join(__import__('secrets').choice(alphabet) for _ in range(16))
        profile.set_password(password)
        profile.save()
        return password

    def reset_password_view(self, request, user_id):
        if not self.has_password_reset_permission(request):
            self.message_user(request, 'You do not have permission to reset passwords.', level=messages.ERROR)
            return redirect(reverse('admin:user_profile_changelist'))

        profile = get_object_or_404(Profile, id=user_id)
        new_password = self._reset_profile_password(profile)
        self.message_user(
            request,
            f'Password reset for {profile.username}. New temporary password: {new_password}',
            level=messages.SUCCESS,
        )

        redirect_to = request.META.get('HTTP_REFERER') or reverse('admin:user_profile_change', args=[profile.pk])
        return redirect(redirect_to)

    def send_welcome_email_view(self, request, user_id):
        if not self.has_password_reset_permission(request):
            self.message_user(request, 'You do not have permission to send welcome emails.', level=messages.ERROR)
            return redirect(reverse('admin:user_profile_changelist'))

        profile = get_object_or_404(Profile, id=user_id)

        if not profile.registration_password:
            self.message_user(
                request,
                f'No stored password for {profile.username}. Reset the password first, then retry.',
                level=messages.WARNING,
            )
            redirect_to = request.META.get('HTTP_REFERER') or reverse('admin:user_profile_change', args=[profile.pk])
            return redirect(redirect_to)

        company = Company.all_objects.filter(client=profile.client).first() if profile.client else None
        sent = mailer_actions.send_new_user_welcome(profile, profile.registration_password, profile.client, company)

        if sent:
            self.message_user(
                request,
                f'Welcome email sent to {profile.email}.',
                level=messages.SUCCESS,
            )
        else:
            self.message_user(
                request,
                f'Failed to send welcome email to {profile.email}. Check server logs for details.',
                level=messages.ERROR,
            )

        redirect_to = request.META.get('HTTP_REFERER') or reverse('admin:user_profile_change', args=[profile.pk])
        return redirect(redirect_to)

    def send_welcome_email_action(self, obj):
        if not obj.pk:
            return '-'
        url = reverse('admin:user_profile_send_welcome_email', args=[obj.pk])
        return format_html(
            '<a class="button" href="{}">Send welcome email</a>',
            url,
        )

    send_welcome_email_action.short_description = 'Welcome Email'

    def reset_password_action(self, obj):
        if not obj.pk:
            return 'Save the user before resetting the password.'

        url = reverse('admin:user_profile_reset_password', args=[obj.pk])
        return format_html(
            '<a class="button" href="{}">Reset password</a>',
            url,
        )

    reset_password_action.short_description = 'Reset Password'

    def reset_password_link(self, obj):
        if not obj.pk:
            return '-'
        url = reverse('admin:user_profile_reset_password', args=[obj.pk])
        return format_html('<a href="{}">Reset password</a>', url)

    reset_password_link.short_description = 'Password Reset'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            # Superusers can see all profiles
            return qs
        elif request.user.is_system_admin():
            return qs
        elif hasattr(request.user, 'client') and request.user.client:
            # Regular users see only profiles from their client
            return qs.filter(client=request.user.client)
        else:
            # Users without clients see nothing
            return qs.none()

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(super().get_readonly_fields(request, obj))
        if self.has_password_reset_permission(request):
            readonly_fields.append('reset_password_action')
            readonly_fields.append('send_welcome_email_action')
        return readonly_fields

    def get_fieldsets(self, request, obj=None):
        fieldsets = list(super().get_fieldsets(request, obj))
        personal_info_name, personal_info_options = fieldsets[1]
        personal_fields = list(personal_info_options['fields'])

        for field_name in ('phone_number', 'role', 'client', 'registration_password', 'reset_password_action', 'send_welcome_email_action'):
            if field_name not in personal_fields:
                personal_fields.append(field_name)

        if not self.has_password_reset_permission(request):
            for field_name in ('reset_password_action', 'send_welcome_email_action'):
                if field_name in personal_fields:
                    personal_fields.remove(field_name)

        fieldsets[1] = (personal_info_name, {'fields': tuple(personal_fields)})
        return fieldsets

    def get_list_display(self, request):
        list_display = list(super().get_list_display(request))
        if self.has_password_reset_permission(request):
            if 'reset_password_link' not in list_display:
                list_display.append('reset_password_link')
        elif 'reset_password_link' in list_display:
            list_display.remove('reset_password_link')
        return tuple(list_display)

    def save_model(self, request, obj, form, change):
        if hasattr(form, 'cleaned_data') and form.cleaned_data.get('password1'):
            obj.registration_password = form.cleaned_data['password1']
        if not change and hasattr(request.user, 'client') and request.user.client:
            # Auto-assign client for new users
            obj.client = request.user.client
        super().save_model(request, obj, form, change)

    # Update fieldsets to include client field
    fieldsets = list(UserAdmin.fieldsets)
    fieldsets[1] = ('Personal Info', {
        'fields': ('first_name', 'last_name', 'email', 'phone_number', 'role', 'client', 'registration_password')
    })
    
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'role', 'client')
    list_filter = UserAdmin.list_filter + ('client', 'role')
    search_fields = UserAdmin.search_fields + ('client__name',)
    inlines = []  # populated below after UserSessionInline is defined


admin.site.register(Profile, ProfileAdmin)


# ── UserSession ────────────────────────────────────────────────────────────────

def _fmt_duration(obj):
    total = int(obj.duration.total_seconds())
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h}г {m}хв"
    if m:
        return f"{m}хв {s}с"
    return f"{s}с"


class UserSessionInline(admin.TabularInline):
    model = UserSession
    extra = 0
    can_delete = False
    max_num = 0
    ordering = ['-login_at']
    fields = ['login_at', 'logout_at', 'duration_col', 'status_col', 'ip_address']
    readonly_fields = ['login_at', 'logout_at', 'duration_col', 'status_col', 'ip_address']

    def duration_col(self, obj):
        if not obj.pk:
            return '-'
        return _fmt_duration(obj)
    duration_col.short_description = 'Тривалість'

    def status_col(self, obj):
        if not obj.pk:
            return '-'
        if obj.is_active:
            return format_html('<span style="color:#19a34a;font-weight:700;">● Активна</span>')
        return format_html('<span style="color:#94a3b8;">○ Завершена</span>')
    status_col.short_description = 'Статус'


ProfileAdmin.inlines = [UserSessionInline]


class UserActivityInline(admin.TabularInline):
    model = UserActivity
    extra = 0
    can_delete = False
    max_num = 0
    ordering = ['-timestamp']
    fields = ['timestamp', 'method_col', 'action_label', 'path', 'status_col']
    readonly_fields = ['timestamp', 'method_col', 'action_label', 'path', 'status_col']

    def method_col(self, obj):
        if not obj.pk:
            return '-'
        colours = {'GET': '#64748b', 'POST': '#19a34a', 'PUT': '#d97706', 'PATCH': '#d97706', 'DELETE': '#dc2626'}
        colour = colours.get(obj.method, '#172033')
        return format_html('<span style="color:{};font-weight:700;font-family:monospace;">{}</span>', colour, obj.method)
    method_col.short_description = 'Метод'

    def status_col(self, obj):
        if not obj.pk:
            return '-'
        colour = '#19a34a' if obj.status_code < 400 else ('#d97706' if obj.status_code < 500 else '#dc2626')
        return format_html('<span style="color:{};font-weight:700;">{}</span>', colour, obj.status_code)
    status_col.short_description = 'Статус'


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'login_at', 'logout_at', 'duration_col', 'status_col', 'ip_address']
    list_filter = ['user__client', 'user__role', 'login_at']
    search_fields = ['user__username', 'user__email', 'ip_address']
    readonly_fields = ['user', 'session_id', 'login_at', 'logout_at', 'ip_address', 'user_agent', 'duration_col', 'status_col']
    ordering = ['-login_at']
    date_hierarchy = 'login_at'
    inlines = [UserActivityInline]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def duration_col(self, obj):
        return _fmt_duration(obj)
    duration_col.short_description = 'Тривалість'

    def status_col(self, obj):
        if obj.is_active:
            return format_html('<span style="color:#19a34a;font-weight:700;">● Активна</span>')
        return format_html('<span style="color:#94a3b8;">○ Завершена</span>')
    status_col.short_description = 'Статус'


# ── UserActivity ───────────────────────────────────────────────────────────────

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'user', 'method_col', 'action_label', 'path', 'status_col']
    list_filter = ['method', 'user__client', 'user__role', 'timestamp']
    search_fields = ['user__username', 'user__email', 'action_label', 'path']
    readonly_fields = ['session', 'user', 'method', 'path', 'action_label', 'status_code', 'timestamp', 'method_col', 'status_col']
    ordering = ['-timestamp']
    date_hierarchy = 'timestamp'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def method_col(self, obj):
        colours = {'GET': '#64748b', 'POST': '#19a34a', 'PUT': '#d97706', 'PATCH': '#d97706', 'DELETE': '#dc2626'}
        colour = colours.get(obj.method, '#172033')
        return format_html('<span style="color:{};font-weight:700;font-family:monospace;">{}</span>', colour, obj.method)
    method_col.short_description = 'Метод'

    def status_col(self, obj):
        colour = '#19a34a' if obj.status_code < 400 else ('#d97706' if obj.status_code < 500 else '#dc2626')
        return format_html('<span style="color:{};font-weight:700;">{}</span>', colour, obj.status_code)
    status_col.short_description = 'HTTP'


