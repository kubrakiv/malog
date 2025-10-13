"""
Management command to set up a new client with admin user
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import transaction
from base.models import Client
from base.utils import create_client_with_admin_user

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a new client with an admin user'

    def add_arguments(self, parser):
        parser.add_argument('client_name', type=str, help='Name of the client')
        parser.add_argument('username', type=str, help='Username for the admin user')
        parser.add_argument('email', type=str, help='Email for the admin user')
        parser.add_argument('--password', type=str, help='Password for the admin user')
        parser.add_argument('--slug', type=str, help='Client slug (default: auto-generated from name)')
        parser.add_argument('--superuser', action='store_true', help='Make the user a superuser')

    def handle(self, *args, **options):
        client_name = options['client_name']
        username = options['username']
        email = options['email']
        password = options.get('password')
        slug = options.get('slug')
        make_superuser = options.get('superuser', False)

        if not password:
            password = self.get_password()

        # Check if client already exists
        if Client.objects.filter(name=client_name).exists():
            raise CommandError(f'Client "{client_name}" already exists')

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            raise CommandError(f'User "{username}" already exists')

        try:
            with transaction.atomic():
                # Create client and user
                client_kwargs = {}
                if slug:
                    client_kwargs['slug'] = slug

                client, user = create_client_with_admin_user(
                    client_name=client_name,
                    username=username,
                    email=email,
                    password=password,
                    **client_kwargs
                )

                if make_superuser:
                    user.is_superuser = True
                    user.is_staff = True
                    user.save()

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created client "{client.name}" with admin user "{user.username}"'
                    )
                )
                self.stdout.write(f'Client ID: {client.id}')
                self.stdout.write(f'Client slug: {client.slug}')

        except Exception as e:
            raise CommandError(f'Error creating client: {str(e)}')

    def get_password(self):
        """Get password from user input"""
        import getpass
        password = None
        while not password:
            password = getpass.getpass('Enter password for admin user: ')
            if not password:
                self.stdout.write(self.style.ERROR('Password cannot be empty'))
        return password