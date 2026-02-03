"""
Management command to generate and manage external API keys.

Usage:
    python manage.py manage_api_keys create "YouScore Integration"
    python manage.py manage_api_keys list
    python manage.py manage_api_keys deactivate <key>
    python manage.py manage_api_keys activate <key>
    python manage.py manage_api_keys delete <key>
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from base.models import ExternalAPIKey
from datetime import timedelta


class Command(BaseCommand):
    help = 'Manage external API keys for accessing the system'

    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            type=str,
            choices=['create', 'list', 'deactivate', 'activate', 'delete', 'info'],
            help='Action to perform'
        )
        parser.add_argument(
            'name_or_key',
            nargs='?',
            type=str,
            help='Name for new API key or key value for other actions'
        )
        parser.add_argument(
            '--description',
            type=str,
            help='Description for the API key (for create action)'
        )
        parser.add_argument(
            '--rate-limit',
            type=int,
            default=100,
            help='Rate limit per hour (0 = unlimited)'
        )
        parser.add_argument(
            '--expires-in-days',
            type=int,
            help='Number of days until the key expires'
        )
        parser.add_argument(
            '--allowed-endpoints',
            type=str,
            nargs='*',
            help='List of endpoint patterns this key can access'
        )
        parser.add_argument(
            '--ip-whitelist',
            type=str,
            nargs='*',
            help='List of IP addresses allowed to use this key'
        )

    def handle(self, *args, **options):
        action = options['action']

        if action == 'create':
            self.create_key(options)
        elif action == 'list':
            self.list_keys()
        elif action == 'deactivate':
            self.deactivate_key(options['name_or_key'])
        elif action == 'activate':
            self.activate_key(options['name_or_key'])
        elif action == 'delete':
            self.delete_key(options['name_or_key'])
        elif action == 'info':
            self.show_key_info(options['name_or_key'])

    def create_key(self, options):
        """Create a new API key"""
        name = options.get('name_or_key')
        
        if not name:
            self.stdout.write(self.style.ERROR('Name is required for creating an API key'))
            return

        # Calculate expiration date if specified
        expires_at = None
        if options.get('expires_in_days'):
            expires_at = timezone.now() + timedelta(days=options['expires_in_days'])

        # Create the API key
        api_key = ExternalAPIKey.objects.create(
            name=name,
            description=options.get('description', ''),
            rate_limit=options.get('rate_limit', 100),
            expires_at=expires_at,
            allowed_endpoints=options.get('allowed_endpoints', []),
            ip_whitelist=options.get('ip_whitelist', [])
        )

        self.stdout.write(self.style.SUCCESS('\n✅ API Key created successfully!\n'))
        self.stdout.write(self.style.WARNING('⚠️  IMPORTANT: Save this key securely. You won\'t be able to see it again!\n'))
        self.stdout.write('─' * 80)
        self.stdout.write(f'Name:         {api_key.name}')
        self.stdout.write(f'API Key:      {api_key.key}')
        self.stdout.write(f'Description:  {api_key.description or "N/A"}')
        self.stdout.write(f'Rate Limit:   {api_key.rate_limit} requests/hour' + (' (unlimited)' if api_key.rate_limit == 0 else ''))
        self.stdout.write(f'Expires:      {api_key.expires_at or "Never"}')
        self.stdout.write(f'Status:       {"Active" if api_key.is_active else "Inactive"}')
        self.stdout.write(f'Created:      {api_key.created_at}')
        
        if api_key.allowed_endpoints:
            self.stdout.write(f'Endpoints:    {", ".join(api_key.allowed_endpoints)}')
        else:
            self.stdout.write('Endpoints:    All (no restrictions)')
        
        if api_key.ip_whitelist:
            self.stdout.write(f'IP Whitelist: {", ".join(api_key.ip_whitelist)}')
        else:
            self.stdout.write('IP Whitelist: All (no restrictions)')
        
        self.stdout.write('─' * 80)
        self.stdout.write('\n📝 Usage Example:')
        self.stdout.write('curl -H "X-API-Key: ' + api_key.key + '" https://yourdomain.com/api/endpoint\n')

    def list_keys(self):
        """List all API keys"""
        keys = ExternalAPIKey.objects.all()

        if not keys.exists():
            self.stdout.write(self.style.WARNING('No API keys found'))
            return

        self.stdout.write('\n' + '═' * 120)
        self.stdout.write(self.style.SUCCESS('External API Keys'))
        self.stdout.write('═' * 120)

        for key in keys:
            status_style = self.style.SUCCESS if key.is_active else self.style.ERROR
            status = "✅ Active" if key.is_active else "❌ Inactive"
            
            expired = ""
            if key.expires_at:
                if timezone.now() > key.expires_at:
                    expired = self.style.ERROR(" [EXPIRED]")
                    status = "❌ Expired"
            
            self.stdout.write('\n' + '─' * 120)
            self.stdout.write(f'Name:       {key.name}')
            self.stdout.write(f'Key:        {key.key[:20]}...{key.key[-10:]}')
            self.stdout.write(status_style(f'Status:     {status}{expired}'))
            self.stdout.write(f'Created:    {key.created_at.strftime("%Y-%m-%d %H:%M")}')
            self.stdout.write(f'Last Used:  {key.last_used_at.strftime("%Y-%m-%d %H:%M") if key.last_used_at else "Never"}')
            self.stdout.write(f'Usage:      {key.usage_count} times')
            self.stdout.write(f'Rate Limit: {key.rate_limit}/hour' + (' (unlimited)' if key.rate_limit == 0 else ''))
            
            if key.expires_at:
                self.stdout.write(f'Expires:    {key.expires_at.strftime("%Y-%m-%d %H:%M")}')
            
            if key.description:
                self.stdout.write(f'Descr:      {key.description}')

        self.stdout.write('─' * 120 + '\n')
        self.stdout.write(f'Total: {keys.count()} API keys\n')

    def deactivate_key(self, key_value):
        """Deactivate an API key"""
        if not key_value:
            self.stdout.write(self.style.ERROR('Key value is required'))
            return

        try:
            api_key = ExternalAPIKey.objects.get(key=key_value)
            api_key.is_active = False
            api_key.save()
            self.stdout.write(self.style.SUCCESS(f'✅ API key "{api_key.name}" has been deactivated'))
        except ExternalAPIKey.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ API key not found: {key_value}'))

    def activate_key(self, key_value):
        """Activate an API key"""
        if not key_value:
            self.stdout.write(self.style.ERROR('Key value is required'))
            return

        try:
            api_key = ExternalAPIKey.objects.get(key=key_value)
            api_key.is_active = True
            api_key.save()
            self.stdout.write(self.style.SUCCESS(f'✅ API key "{api_key.name}" has been activated'))
        except ExternalAPIKey.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ API key not found: {key_value}'))

    def delete_key(self, key_value):
        """Delete an API key"""
        if not key_value:
            self.stdout.write(self.style.ERROR('Key value is required'))
            return

        try:
            api_key = ExternalAPIKey.objects.get(key=key_value)
            name = api_key.name
            api_key.delete()
            self.stdout.write(self.style.SUCCESS(f'✅ API key "{name}" has been deleted'))
        except ExternalAPIKey.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ API key not found: {key_value}'))

    def show_key_info(self, key_value):
        """Show detailed information about an API key"""
        if not key_value:
            self.stdout.write(self.style.ERROR('Key value is required'))
            return

        try:
            api_key = ExternalAPIKey.objects.get(key=key_value)
            
            self.stdout.write('\n' + '═' * 80)
            self.stdout.write(self.style.SUCCESS(f'API Key Information: {api_key.name}'))
            self.stdout.write('═' * 80)
            self.stdout.write(f'Name:           {api_key.name}')
            self.stdout.write(f'Key:            {api_key.key}')
            self.stdout.write(f'Description:    {api_key.description or "N/A"}')
            self.stdout.write(f'Status:         {"✅ Active" if api_key.is_active else "❌ Inactive"}')
            self.stdout.write(f'Rate Limit:     {api_key.rate_limit} requests/hour' + (' (unlimited)' if api_key.rate_limit == 0 else ''))
            self.stdout.write(f'Created:        {api_key.created_at}')
            self.stdout.write(f'Updated:        {api_key.updated_at}')
            self.stdout.write(f'Last Used:      {api_key.last_used_at or "Never"}')
            self.stdout.write(f'Usage Count:    {api_key.usage_count}')
            self.stdout.write(f'Expires:        {api_key.expires_at or "Never"}')
            
            if api_key.allowed_endpoints:
                self.stdout.write(f'Endpoints:      {", ".join(api_key.allowed_endpoints)}')
            else:
                self.stdout.write('Endpoints:      All (no restrictions)')
            
            if api_key.ip_whitelist:
                self.stdout.write(f'IP Whitelist:   {", ".join(api_key.ip_whitelist)}')
            else:
                self.stdout.write('IP Whitelist:   All (no restrictions)')
            
            if api_key.created_by:
                self.stdout.write(f'Created By:     {api_key.created_by.username}')
            
            self.stdout.write('═' * 80 + '\n')
            
        except ExternalAPIKey.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ API key not found: {key_value}'))
