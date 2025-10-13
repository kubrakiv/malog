"""
Management command to list all clients and their statistics
"""
from django.core.management.base import BaseCommand
from base.models import Client
from base.utils import get_client_statistics


class Command(BaseCommand):
    help = 'List all clients and their statistics'

    def add_arguments(self, parser):
        parser.add_argument(
            '--detailed',
            action='store_true',
            help='Show detailed statistics for each client'
        )

    def handle(self, *args, **options):
        detailed = options.get('detailed', False)
        
        clients = Client.objects.all().order_by('name')
        
        if not clients.exists():
            self.stdout.write(self.style.WARNING('No clients found'))
            return

        self.stdout.write(f'Found {clients.count()} clients:')
        self.stdout.write('=' * 50)

        for client in clients:
            status = "✓ Active" if client.is_active else "✗ Inactive"
            self.stdout.write(f'\nClient: {client.name} ({status})')
            self.stdout.write(f'  Slug: {client.slug}')
            self.stdout.write(f'  ID: {client.id}')
            self.stdout.write(f'  Created: {client.created_at.strftime("%Y-%m-%d %H:%M")}')

            if detailed:
                try:
                    stats = get_client_statistics(client)
                    self.stdout.write('  Statistics:')
                    for key, value in stats.items():
                        self.stdout.write(f'    {key.title()}: {value}')
                except Exception as e:
                    self.stdout.write(f'    Error getting statistics: {str(e)}')
            
            self.stdout.write('-' * 30)