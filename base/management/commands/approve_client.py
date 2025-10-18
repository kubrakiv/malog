from django.core.management.base import BaseCommand
from django.db import transaction
from base.models import Client
from base.subscription_models import ClientSubscription
from user.models import Profile


class Command(BaseCommand):
    help = 'Approve client registration and activate trial/subscription'

    def add_arguments(self, parser):
        parser.add_argument('client_id', type=int, help='Client ID to approve')
        parser.add_argument(
            '--activate-users',
            action='store_true',
            help='Also activate all users for this client'
        )

    def handle(self, *args, **options):
        client_id = options['client_id']
        activate_users = options.get('activate_users', False)

        try:
            with transaction.atomic():
                # Get the client
                client = Client.objects.get(id=client_id)
                
                if client.is_approved:
                    self.stdout.write(
                        self.style.WARNING(f'Client {client.name} is already approved')
                    )
                    return

                # Approve the client
                client.is_approved = True
                client.is_active = True
                client.approval_status = 'approved'
                client.save()
                
                self.stdout.write(
                    self.style.SUCCESS(f'Client {client.name} approved successfully')
                )

                # Activate subscription
                pending_subscription = ClientSubscription.objects.filter(
                    client=client,
                    status='pending'
                ).first()

                if pending_subscription:
                    if pending_subscription.is_trial:
                        # Activate trial
                        pending_subscription.status = 'trial'
                        self.stdout.write(
                            self.style.SUCCESS(f'Trial subscription activated for {client.name}')
                        )
                        self.stdout.write(
                            f'Trial ends on: {pending_subscription.trial_end_date}'
                        )
                    else:
                        # Activate regular subscription
                        pending_subscription.status = 'active'
                        self.stdout.write(
                            self.style.SUCCESS(f'Subscription activated for {client.name}')
                        )
                    
                    pending_subscription.save()
                else:
                    self.stdout.write(
                        self.style.WARNING(f'No pending subscription found for {client.name}')
                    )

                # Activate users if requested
                if activate_users:
                    inactive_users = Profile.objects.filter(client=client, is_active=False)
                    user_count = inactive_users.update(is_active=True)
                    self.stdout.write(
                        self.style.SUCCESS(f'Activated {user_count} users for {client.name}')
                    )

                self.stdout.write(
                    self.style.SUCCESS(f'Client approval process completed for {client.name}')
                )

        except Client.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Client with ID {client_id} not found')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error approving client: {str(e)}')
            )