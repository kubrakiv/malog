"""
Management command to manage Sovtes client subscriptions
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from base.models import Client
from base.subscription_models import SubscriptionPlan, ClientSubscription
from base.sovtes_auth import SovtesUserManager


class Command(BaseCommand):
    help = 'Manage Sovtes client subscriptions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--action',
            type=str,
            choices=['assign-default', 'list', 'upgrade', 'extend'],
            default='list',
            help='Action to perform (default: list)',
        )
        parser.add_argument(
            '--client-id',
            type=int,
            help='Sovtes client ID to operate on',
        )
        parser.add_argument(
            '--plan',
            type=str,
            help='Plan name for upgrade action',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Days to extend subscription (default: 30)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        action = options['action']
        client_id = options.get('client_id')
        plan_name = options.get('plan')
        days = options['days']
        dry_run = options['dry_run']

        if action == 'assign-default':
            self.assign_default_subscriptions(dry_run)
        elif action == 'list':
            self.list_sovtes_subscriptions(client_id)
        elif action == 'upgrade':
            if not client_id or not plan_name:
                self.stdout.write(
                    self.style.ERROR('--client-id and --plan are required for upgrade action')
                )
                return
            self.upgrade_subscription(client_id, plan_name, dry_run)
        elif action == 'extend':
            if not client_id:
                self.stdout.write(
                    self.style.ERROR('--client-id is required for extend action')
                )
                return
            self.extend_subscription(client_id, days, dry_run)

    def assign_default_subscriptions(self, dry_run):
        """Assign default subscriptions to Sovtes clients without active subscriptions"""
        sovtes_clients = Client.objects.filter(
            slug__startswith='sovtes-',
            is_active=True,
            is_approved=True
        )

        clients_without_subscription = []
        
        for client in sovtes_clients:
            has_active_subscription = ClientSubscription.objects.filter(
                client=client,
                status='active'
            ).exists()
            
            if not has_active_subscription:
                clients_without_subscription.append(client)

        if not clients_without_subscription:
            self.stdout.write(
                self.style.SUCCESS('All Sovtes clients already have active subscriptions!')
            )
            return

        self.stdout.write(
            f'Found {len(clients_without_subscription)} Sovtes clients without active subscriptions:'
        )
        
        for client in clients_without_subscription:
            sovtes_id = client.slug.replace('sovtes-', '')
            self.stdout.write(f'  - {client.name} (Sovtes ID: {sovtes_id})')

        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN: No changes made. Use without --dry-run to apply changes.')
            )
            return

        # Assign default subscriptions
        for client in clients_without_subscription:
            SovtesUserManager._assign_default_subscription(client)
            sovtes_id = client.slug.replace('sovtes-', '')
            self.stdout.write(
                self.style.SUCCESS(f'✓ Assigned default subscription to {client.name} (Sovtes ID: {sovtes_id})')
            )

    def list_sovtes_subscriptions(self, specific_client_id=None):
        """List all Sovtes client subscriptions"""
        if specific_client_id:
            # List specific client
            client_slug = f'sovtes-{specific_client_id}'
            try:
                client = Client.objects.get(slug=client_slug)
                self.display_client_subscription(client)
            except Client.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Sovtes client with ID {specific_client_id} not found')
                )
        else:
            # List all Sovtes clients
            sovtes_clients = Client.objects.filter(
                slug__startswith='sovtes-',
                is_active=True
            ).order_by('slug')

            if not sovtes_clients.exists():
                self.stdout.write(
                    self.style.WARNING('No Sovtes clients found')
                )
                return

            self.stdout.write(
                self.style.SUCCESS(f'Found {sovtes_clients.count()} Sovtes clients:')
            )
            self.stdout.write('-' * 80)

            for client in sovtes_clients:
                self.display_client_subscription(client)
                self.stdout.write('-' * 40)

    def display_client_subscription(self, client):
        """Display subscription information for a client"""
        sovtes_id = client.slug.replace('sovtes-', '')
        self.stdout.write(f'Client: {client.name} (Sovtes ID: {sovtes_id})')
        
        subscription_info = SovtesUserManager.get_client_subscription_info(client)
        
        if subscription_info:
            self.stdout.write(f'  Plan: {subscription_info["plan_display_name"]} ({subscription_info["plan_name"]})')
            self.stdout.write(f'  Status: {subscription_info["status"]}')
            self.stdout.write(f'  Billing: {subscription_info["billing_cycle"]}')
            self.stdout.write(f'  Truck Limit: {subscription_info["truck_limit"]}')
            self.stdout.write(f'  Start: {subscription_info["start_date"][:10]}')
            self.stdout.write(f'  End: {subscription_info["end_date"][:10]}')
            self.stdout.write(f'  Auto Renew: {subscription_info["auto_renew"]}')
            self.stdout.write(f'  Trial: {subscription_info["is_trial"]}')
        else:
            self.stdout.write(
                self.style.WARNING('  No active subscription found')
            )

    def upgrade_subscription(self, client_id, plan_name, dry_run):
        """Upgrade a Sovtes client's subscription plan"""
        client_slug = f'sovtes-{client_id}'
        
        try:
            client = Client.objects.get(slug=client_slug)
        except Client.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Sovtes client with ID {client_id} not found')
            )
            return

        try:
            new_plan = SubscriptionPlan.objects.get(name=plan_name, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Subscription plan "{plan_name}" not found or inactive')
            )
            return

        try:
            current_subscription = ClientSubscription.objects.get(
                client=client,
                status='active'
            )
        except ClientSubscription.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'No active subscription found for Sovtes client {client_id}')
            )
            return

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would upgrade {client.name} from {current_subscription.plan.display_name} to {new_plan.display_name}'
                )
            )
            return

        # Update the subscription plan
        current_subscription.plan = new_plan
        current_subscription.save()

        self.stdout.write(
            self.style.SUCCESS(
                f'✓ Upgraded {client.name} to {new_plan.display_name}'
            )
        )

    def extend_subscription(self, client_id, days, dry_run):
        """Extend a Sovtes client's subscription"""
        client_slug = f'sovtes-{client_id}'
        
        try:
            client = Client.objects.get(slug=client_slug)
        except Client.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Sovtes client with ID {client_id} not found')
            )
            return

        try:
            subscription = ClientSubscription.objects.get(
                client=client,
                status='active'
            )
        except ClientSubscription.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'No active subscription found for Sovtes client {client_id}')
            )
            return

        new_end_date = subscription.end_date + timedelta(days=days)

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would extend {client.name} subscription by {days} days (new end date: {new_end_date.date()})'
                )
            )
            return

        subscription.end_date = new_end_date
        subscription.save()

        self.stdout.write(
            self.style.SUCCESS(
                f'✓ Extended {client.name} subscription by {days} days (new end date: {new_end_date.date()})'
            )
        )