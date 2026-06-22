from django.core.management.base import BaseCommand
from user.models import Profile, LogistProfile, AdminProfile


class Command(BaseCommand):
    help = "Create missing LogistProfile / AdminProfile for existing users"

    def handle(self, *args, **options):
        logist_role_names = {"logist"}
        admin_role_names = {"client_admin", "admin"}

        logists = Profile.objects.filter(
            role__name__in=logist_role_names
        ).exclude(logistprofile__isnull=False)

        created_logist = 0
        for profile in logists:
            LogistProfile.objects.get_or_create(
                profile=profile,
                defaults={"phone_number": profile.phone_number},
            )
            created_logist += 1
            self.stdout.write(f"  LogistProfile created for {profile.username}")

        admins = Profile.objects.filter(
            role__name__in=admin_role_names
        ).exclude(adminprofile__isnull=False)

        created_admin = 0
        for profile in admins:
            AdminProfile.objects.get_or_create(
                profile=profile,
                defaults={"phone_number": profile.phone_number},
            )
            created_admin += 1
            self.stdout.write(f"  AdminProfile created for {profile.username}")

        self.stdout.write(self.style.SUCCESS(
            f"\nDone. Created {created_logist} LogistProfile(s), {created_admin} AdminProfile(s)."
        ))
