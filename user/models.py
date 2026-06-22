import uuid
from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# Create your models here.
class Role(models.Model):
    name = models.CharField(max_length=25)

    def __str__(self):
        return self.name


class Profile(AbstractUser):
    # Import Client model reference to avoid circular import
    client = models.ForeignKey(
        'base.Client',
        related_name="users",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Client that this user belongs to"
    )
    role = models.ForeignKey(Role, related_name="profiles", on_delete=models.CASCADE, null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    registration_password = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Stores the password provided during the latest registration or password reset flow"
    )

    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profiles"

    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        if getattr(self, '_password', None):
            self.registration_password = self._password
        super().save(*args, **kwargs)
    
    def is_system_admin(self):
        """Check if user is a system administrator"""
        return self.role and self.role.name.lower() == 'system_admin'
    
    def is_client_admin(self):
        """Check if user is a client administrator"""
        return self.role and self.role.name.lower() == 'client_admin'
    
    def is_any_admin(self):
        """Check if user has any admin role"""
        admin_roles = ['admin', 'system_admin', 'client_admin']
        return self.role and self.role.name.lower() in admin_roles
    
    def can_manage_client(self, client):
        """Check if user can manage a specific client"""
        if self.is_system_admin():
            return True  # System admins can manage all clients
        elif self.is_client_admin():
            return self.client == client  # Client admins can only manage their own client
        return False

  
class AdminProfile(models.Model):
    profile = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete = models.CASCADE, primary_key = True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    position = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.profile.username + " " + self.position


class LogistProfile(models.Model):
    profile = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete = models.CASCADE, primary_key = True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    position = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.profile.username} {self.position or ''}".strip()

class DriverProfile(models.Model):
    profile = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete = models.CASCADE, primary_key = True)
    image = models.ImageField(upload_to='images/', null=True, blank=True)
    first_name = models.CharField(max_length=255, null=True, blank=True)
    last_name = models.CharField(max_length=255, null=True, blank=True)
    middle_name = models.CharField(max_length=255, null=True, blank=True)
    full_name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(max_length=255, null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    position = models.CharField(max_length=255, null=True, blank=True)
    license_series = models.CharField(max_length=255, blank=True, null=True)
    license_number = models.CharField(max_length=255, blank=True, null=True)
    birth_date = models.DateField(auto_now_add=False, null=True, blank=True)
    started_work = models.DateField(auto_now_add=False, null=True, blank=True)
    finished_work = models.DateField(auto_now_add=False, null=True, blank=True)
    country = models.CharField(max_length=255, blank=True, null=True)
    sovtes_id = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        if self.full_name:
            return self.full_name
        else:
            return self.profile.username


class UserSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_sessions',
    )
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    login_at = models.DateTimeField(auto_now_add=True)
    logout_at = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-login_at']
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'

    def __str__(self):
        return f"{self.user.username} — {self.login_at.strftime('%Y-%m-%d %H:%M')}"

    @property
    def duration(self):
        end = self.logout_at or timezone.now()
        return end - self.login_at

    @property
    def is_active(self):
        return self.logout_at is None


class UserActivity(models.Model):
    session = models.ForeignKey(
        UserSession,
        on_delete=models.CASCADE,
        related_name='activities',
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='activities',
    )
    method = models.CharField(max_length=10)
    path = models.CharField(max_length=500)
    action_label = models.CharField(max_length=255, blank=True)
    status_code = models.PositiveSmallIntegerField()
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'User Activity'
        verbose_name_plural = 'User Activities'

    def __str__(self):
        label = self.action_label or self.path
        return f"{self.user.username} — {label} [{self.method}]"


