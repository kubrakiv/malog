"""
Management command to list users with their client information
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Command(BaseCommand):
    help = 'List all users with their client information'

    def add_arguments(self, parser):
        parser.add_argument(
            '--client',
            type=str,
            help='Filter by client name or slug'
        )

    def handle(self, *args, **options):
        client_filter = options.get('client')
        
        users = User.objects.all()
        
        if client_filter:
            users = users.filter(
                models.Q(client__name__icontains=client_filter) |
                models.Q(client__slug__icontains=client_filter)
            )
        
        if not users.exists():
            self.stdout.write(self.style.WARNING('No users found'))
            return

        self.stdout.write(f'Found {users.count()} users:')
        self.stdout.write('=' * 80)

        for user in users:
            self.stdout.write(f'\nUsername: {user.username}')
            self.stdout.write(f'  ID: {user.id}')
            self.stdout.write(f'  Email: {user.email}')
            self.stdout.write(f'  Is superuser: {user.is_superuser}')
            self.stdout.write(f'  Is staff: {user.is_staff}')
            self.stdout.write(f'  Is active: {user.is_active}')
            
            if hasattr(user, 'client') and user.client:
                self.stdout.write(f'  Client: {user.client.name} (ID: {user.client.id})')
                self.stdout.write(f'  Client slug: {user.client.slug}')
            else:
                self.stdout.write(f'  Client: None')
            
            self.stdout.write(f'  Date joined: {user.date_joined}')
            self.stdout.write(f'  Last login: {user.last_login or "Never"}')
            self.stdout.write('-' * 40)