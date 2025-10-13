from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import transaction
from .models import Profile,  DriverProfile


@receiver(pre_save, sender=Profile)
def update_user_username(sender, instance, **kwargs):
    # Always ensure the username matches the email
    if instance.email:
        instance.username = instance.email


@receiver(post_save, sender=Profile)
def create_or_update_driver_profile(sender, instance: Profile, created, **kwargs):
    # Do nothing for staff/superusers (avoid breaking admin logins)
    if getattr(instance, "is_staff", False) or getattr(instance, "is_superuser", False):
        return

    # Safely unwrap role.name (role may be None)
    role = getattr(instance, "role", None)
    role_name = getattr(role, "name", None)

    # Only manage DriverProfile for drivers
    if role_name != "driver":
        return

    full_name = f"{instance.first_name or ''} {instance.last_name or ''}".strip()

    with transaction.atomic():
        if created:
            DriverProfile.objects.get_or_create(
                profile=instance,
                defaults={
                    "phone_number": instance.phone_number,
                    "first_name": instance.first_name,
                    "last_name": instance.last_name,
                    "full_name": full_name,
                    "email": instance.email,
                },
            )
        else:
            # Upsert on non-created saves (e.g., profile edits)
            DriverProfile.objects.update_or_create(
                profile=instance,
                defaults={
                    "phone_number": instance.phone_number,
                    "first_name": instance.first_name,
                    "last_name": instance.last_name,
                    "full_name": full_name,
                    "email": instance.email,
                },
            )
