from django.core.management.base import BaseCommand
from django.utils import timezone
from base.subscription_models import ClientSubscription


class Command(BaseCommand):
    help = 'Check and expire trial subscriptions that have ended'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be expired without making changes'
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        now = timezone.now()

        # Find expired trials
        expired_trials = ClientSubscription.objects.filter(
            status='trial',
            is_trial=True,
            trial_end_date__lt=now
        )

        if not expired_trials.exists():
            self.stdout.write(
                self.style.SUCCESS('No expired trials found')
            )
            return

        self.stdout.write(f'Found {expired_trials.count()} expired trials:')
        
        for trial in expired_trials:
            days_overdue = (now - trial.trial_end_date).days
            
            self.stdout.write(f'  - Client: {trial.client.name}')
            self.stdout.write(f'    Trial ended: {trial.trial_end_date}')
            self.stdout.write(f'    Days overdue: {days_overdue}')
            
            if not dry_run:
                # Expire the trial
                trial.status = 'trial_expired'
                trial.end_date = trial.trial_end_date  # Ensure end_date matches trial_end_date
                trial.save()
                
                self.stdout.write(
                    self.style.SUCCESS(f'    Status updated to: trial_expired')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'    Would be updated to: trial_expired (dry run)')
                )

        if dry_run:
            self.stdout.write(
                self.style.WARNING('\nDry run completed - no changes made')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\nExpired {expired_trials.count()} trial subscriptions')
            )