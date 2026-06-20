from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from base.mailer import send_trial_reminder
from base.subscription_models import ClientSubscription
from user.models import Profile


class Command(BaseCommand):
    help = "Send trial reminder emails to clients"

    def add_arguments(self, parser):
        parser.add_argument(
            "--days-before",
            type=int,
            default=3,
            help="Send reminder X days before trial expires (default: 3)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what emails would be sent without actually sending them",
        )

    def handle(self, *args, **options):
        days_before = options["days_before"]
        dry_run = options["dry_run"]
        target_date = timezone.now() + timedelta(days=days_before)
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = target_date.replace(
            hour=23, minute=59, second=59, microsecond=999999
        )
        expiring_trials = ClientSubscription.objects.filter(
            status="trial",
            is_trial=True,
            trial_end_date__range=(start_of_day, end_of_day),
        )

        if not expiring_trials.exists():
            self.stdout.write(
                self.style.SUCCESS(f"No trials expiring in {days_before} days found")
            )
            return

        self.stdout.write(
            f"Found {expiring_trials.count()} trials expiring in {days_before} days:"
        )
        sent_count = 0
        error_count = 0

        for trial in expiring_trials:
            admin_user = Profile.objects.filter(
                client=trial.client, is_staff=True, is_active=True
            ).first()
            if not admin_user:
                self.stdout.write(
                    self.style.WARNING(f"  No admin user found for {trial.client.name}")
                )
                continue

            self.stdout.write(f"  - {trial.client.name} ({admin_user.email})")
            if dry_run:
                self.stdout.write(self.style.WARNING("    Would send reminder email"))
                continue

            if send_trial_reminder(trial, admin_user, days_before):
                sent_count += 1
                self.stdout.write(self.style.SUCCESS("    Email sent successfully"))
            else:
                error_count += 1
                self.stdout.write(self.style.ERROR("    Failed to send email"))

        if dry_run:
            self.stdout.write(self.style.WARNING("\nDry run completed - no emails sent"))
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nCompleted: {sent_count} emails sent, {error_count} errors"
                )
            )
