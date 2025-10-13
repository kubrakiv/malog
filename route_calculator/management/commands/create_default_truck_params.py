from django.core.management.base import BaseCommand
from django.utils import timezone
from route_calculator.models import TruckParameters, FuelPrices


class Command(BaseCommand):
    help = 'Create default truck parameters and fuel prices'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fuel-only',
            action='store_true',
            help='Create only fuel prices, skip truck parameters',
        )
        parser.add_argument(
            '--truck-only',
            action='store_true',
            help='Create only truck parameters, skip fuel prices',
        )

    def handle(self, *args, **options):
        fuel_only = options['fuel_only']
        truck_only = options['truck_only']
        
        if not fuel_only:
            self.create_truck_parameters()
        
        if not truck_only:
            self.create_fuel_prices()

    def create_truck_parameters(self):
        """Create default truck parameters"""
        # Check if default truck parameters already exist
        if TruckParameters.objects.filter(is_default=True).exists():
            self.stdout.write(
                self.style.WARNING('Default truck parameters already exist')
            )
            return

        # Create default 20-ton standard tautliner truck parameters
        truck_params = TruckParameters.objects.create(
            name='20-ton Standard Tautliner',
            weight_capacity=20,
            truck_type='Tautliner',
            diesel_consumption_per_100km=30.5,  # 30.5 liters per 100km
            adblue_consumption_per_100km=2.4,   # 2.4 liters per 100km
            tire_cost_per_km=0.08,              # 0.08 EUR per km
            fixed_cost_per_km=0.12,             # 0.12 EUR per km (insurance, maintenance, etc.)
            is_default=True
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created default truck parameters: {truck_params}'
            )
        )

    def create_fuel_prices(self):
        """Create default fuel prices"""
        # Check if current fuel prices already exist
        if FuelPrices.objects.filter(is_current=True).exists():
            self.stdout.write(
                self.style.WARNING('Current fuel prices already exist')
            )
            return

        # Create default fuel prices
        fuel_prices = FuelPrices.objects.create(
            diesel_price_per_liter=1.45,    # 1.45 EUR per liter
            adblue_price_per_liter=0.85,    # 0.85 EUR per liter
            currency='EUR',
            effective_date=timezone.now().date(),
            is_current=True
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created default fuel prices: {fuel_prices}'
            )
        )
