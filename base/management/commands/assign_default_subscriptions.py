"""
Management command to assign default subscriptions to clients without active subscriptions
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from base.models import Client
from base.subscription_models import SubscriptionPlan, ClientSubscription


class Command(BaseCommand):
    help = 'Assign default base plan subscriptions to clients without active subscriptions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--plan',
            type=str,
            default='base',
            help='Plan name to assign (default: base)',
        )
        parser.add_argument(
            '--billing-cycle',
            type=str,
            default='monthly',
            choices=['monthly', 'yearly'],
            help='Billing cycle (default: monthly)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        plan_name = options['plan']
        billing_cycle = options['billing_cycle']
        dry_run = options['dry_run']
        
        try:
            # Get the subscription plan
            plan = SubscriptionPlan.objects.get(name=plan_name, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Subscription plan "{plan_name}" not found or inactive')
            )
            return

        # Find clients without active subscriptions
        clients_without_subscription = []
        
        for client in Client.objects.filter(is_active=True, is_approved=True):
            has_active_subscription = ClientSubscription.objects.filter(
                client=client,
                status='active'
            ).exists()
            
            if not has_active_subscription:
                clients_without_subscription.append(client)

        if not clients_without_subscription:
            self.stdout.write(
                self.style.SUCCESS('All active clients already have subscriptions!')
            )
            return

        self.stdout.write(
            f'Found {len(clients_without_subscription)} clients without active subscriptions:'
        )
        
        for client in clients_without_subscription:
            self.stdout.write(f'  - {client.name} (ID: {client.id})')

        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN: No changes made. Use without --dry-run to apply changes.')
            )
            return

        # Create subscriptions
        created_count = 0
        start_date = timezone.now()
        
        if billing_cycle == 'yearly':
            end_date = start_date + timedelta(days=365)
        else:
            end_date = start_date + timedelta(days=30)

        for client in clients_without_subscription:
            try:
                subscription = ClientSubscription.objects.create(
                    client=client,
                    plan=plan,
                    billing_cycle=billing_cycle,
                    status='active',
                    start_date=start_date,
                    end_date=end_date,
                    auto_renew=True
                )
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Created {plan.display_name} subscription for {client.name}'
                    )
                )
                created_count += 1
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'✗ Failed to create subscription for {client.name}: {str(e)}'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {created_count} subscriptions!'
            )
        )