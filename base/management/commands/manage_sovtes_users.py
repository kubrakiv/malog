"""
Management command to manage Sovtes user passwords
"""
from django.core.management.base import BaseCommand
from django.core.exceptions import ValidationError
from user.models import Profile
from base.sovtes_auth import SovtesUserManager


class Command(BaseCommand):
    help = 'Manage Sovtes user passwords and authentication'

    def add_arguments(self, parser):
        parser.add_argument(
            '--action',
            type=str,
            choices=['list', 'info', 'reset-password', 'disable-password'],
            default='list',
            help='Action to perform (default: list)',
        )
        parser.add_argument(
            '--username',
            type=str,
            help='Sovtes username (e.g., sovtes_2384)',
        )
        parser.add_argument(
            '--user-id',
            type=int,
            help='Sovtes user ID (will be converted to sovtes_ID format)',
        )

    def handle(self, *args, **options):
        action = options['action']
        username = options.get('username')
        user_id = options.get('user_id')

        # Convert user_id to username if provided
        if user_id and not username:
            username = f"sovtes_{user_id}"

        if action == 'list':
            self.list_sovtes_users()
        elif action == 'info':
            if not username:
                self.stdout.write(
                    self.style.ERROR('--username or --user-id is required for info action')
                )
                return
            self.show_user_info(username)
        elif action == 'reset-password':
            if not username:
                self.stdout.write(
                    self.style.ERROR('--username or --user-id is required for reset-password action')
                )
                return
            self.reset_user_password(username)
        elif action == 'disable-password':
            if not username:
                self.stdout.write(
                    self.style.ERROR('--username or --user-id is required for disable-password action')
                )
                return
            self.disable_user_password(username)

    def list_sovtes_users(self):
        """List all Sovtes users"""
        sovtes_users = Profile.objects.filter(
            username__startswith='sovtes_'
        ).select_related('client', 'role').order_by('username')

        if not sovtes_users.exists():
            self.stdout.write(
                self.style.WARNING('No Sovtes users found')
            )
            return

        self.stdout.write(
            self.style.SUCCESS(f'Found {sovtes_users.count()} Sovtes users:')
        )
        self.stdout.write('-' * 100)
        
        # Header
        self.stdout.write(
            f"{'Username':<20} {'Client':<25} {'Role':<12} {'Active':<8} {'Has Password':<12} {'Last Login':<15}"
        )
        self.stdout.write('-' * 100)

        for user in sovtes_users:
            client_name = user.client.name if user.client else 'No Client'
            role_name = user.role.name if user.role else 'No Role'
            has_password = 'Yes' if user.password else 'No'
            last_login = user.last_login.strftime('%Y-%m-%d') if user.last_login else 'Never'
            
            self.stdout.write(
                f"{user.username:<20} {client_name:<25} {role_name:<12} "
                f"{'Yes' if user.is_active else 'No':<8} {has_password:<12} {last_login:<15}"
            )

    def show_user_info(self, username):
        """Show detailed information about a Sovtes user"""
        try:
            user = Profile.objects.get(username=username)
        except Profile.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User "{username}" not found')
            )
            return

        if not user.username.startswith('sovtes_'):
            self.stdout.write(
                self.style.ERROR(f'User "{username}" is not a Sovtes user')
            )
            return

        info = SovtesUserManager.get_user_temp_password_info(user)
        
        self.stdout.write(
            self.style.SUCCESS(f'Sovtes User Information: {username}')
        )
        self.stdout.write('-' * 60)
        self.stdout.write(f"Username: {user.username}")
        self.stdout.write(f"Email: {user.email}")
        self.stdout.write(f"First Name: {user.first_name}")
        self.stdout.write(f"Client: {user.client.name if user.client else 'None'}")
        self.stdout.write(f"Role: {user.role.name if user.role else 'None'}")
        self.stdout.write(f"Active: {'Yes' if user.is_active else 'No'}")
        self.stdout.write(f"Staff: {'Yes' if user.is_staff else 'No'}")
        self.stdout.write(f"Superuser: {'Yes' if user.is_superuser else 'No'}")
        self.stdout.write(f"Has Password: {'Yes' if user.password else 'No'}")
        self.stdout.write(f"Last Login: {user.last_login or 'Never'}")
        self.stdout.write(f"Date Joined: {user.date_joined}")
        
        if info:
            self.stdout.write(f"\n{self.style.WARNING('Authentication Info:')}")
            self.stdout.write(f"Method: {info['authentication_method']}")
            self.stdout.write(f"Note: {info['note']}")

    def reset_user_password(self, username):
        """Reset password for a Sovtes user"""
        try:
            user = Profile.objects.get(username=username)
        except Profile.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User "{username}" not found')
            )
            return

        try:
            new_password = SovtesUserManager.reset_sovtes_user_password(user)
            
            self.stdout.write(
                self.style.SUCCESS(f'✓ Password reset for {username}')
            )
            self.stdout.write(
                self.style.WARNING(f'New temporary password: {new_password}')
            )
            self.stdout.write(
                self.style.WARNING('IMPORTANT: This password is for emergency access only.')
            )
            self.stdout.write(
                self.style.WARNING('User should authenticate via Sovtes JWT tokens.')
            )
            
        except ValidationError as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {str(e)}')
            )

    def disable_user_password(self, username):
        """Disable password for a Sovtes user (set to unusable)"""
        try:
            user = Profile.objects.get(username=username)
        except Profile.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User "{username}" not found')
            )
            return

        if not user.username.startswith('sovtes_'):
            self.stdout.write(
                self.style.ERROR(f'User "{username}" is not a Sovtes user')
            )
            return

        # Set password to unusable
        user.set_unusable_password()
        user.save()

        self.stdout.write(
            self.style.SUCCESS(f'✓ Password disabled for {username}')
        )
        self.stdout.write(
            self.style.SUCCESS('User can now only authenticate via Sovtes JWT tokens.')
        )