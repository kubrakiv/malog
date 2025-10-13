"""
Management command to reset password for a user
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
import getpass

User = get_user_model()


class Command(BaseCommand):
    help = 'Reset password for a specific user'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to reset password for')
        parser.add_argument('--password', type=str, help='New password (will prompt if not provided)')

    def handle(self, *args, **options):
        username = options['username']
        password = options.get('password')

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f'User "{username}" does not exist')

        if not password:
            password = self.get_password()

        user.set_password(password)
        user.save()

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully reset password for user "{user.username}"'
            )
        )
        
        # Show user info
        self.stdout.write(f'User ID: {user.id}')
        self.stdout.write(f'Email: {user.email}')
        self.stdout.write(f'Is superuser: {user.is_superuser}')
        self.stdout.write(f'Is staff: {user.is_staff}')
        if hasattr(user, 'client') and user.client:
            self.stdout.write(f'Client: {user.client.name}')

    def get_password(self):
        """Get password from user input"""
        password = None
        while not password:
            password = getpass.getpass('Enter new password: ')
            if not password:
                self.stdout.write(self.style.ERROR('Password cannot be empty'))
            else:
                confirm = getpass.getpass('Confirm password: ')
                if password != confirm:
                    self.stdout.write(self.style.ERROR('Passwords do not match'))
                    password = None
        return password