from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser

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
        return self.profile.username + " " + self.position

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

    def __str__(self):
        if self.full_name:
            return self.full_name
        else:
            return self.profile.username


