from django.db import models
from django.conf import settings

# Create your models here.
from django.db import models
from django.contrib.auth import get_user_model
from base.models import BaseTenantModel

User = get_user_model()


class FuelPrices(BaseTenantModel):
    """Current fuel prices for cost calculations"""
    diesel_price_per_liter = models.DecimalField(
        max_digits=6, 
        decimal_places=3,
        verbose_name="Diesel Price per Liter",
        help_text="Current diesel price per liter in EUR"
    )
    adblue_price_per_liter = models.DecimalField(
        max_digits=6, 
        decimal_places=3,
        verbose_name="AdBlue Price per Liter",
        help_text="Current AdBlue price per liter in EUR"
    )
    
    currency = models.CharField(
        max_length=3,
        default='EUR',
        verbose_name="Currency",
        help_text="Currency for the prices"
    )
    
    is_current = models.BooleanField(
        default=True,
        verbose_name="Current Prices",
        help_text="Mark as current fuel prices"
    )
    
    effective_date = models.DateField(
        verbose_name="Effective Date",
        help_text="Date when these prices become effective"
    )
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Fuel Prices"
        verbose_name_plural = "Fuel Prices"
        ordering = ["-effective_date", "-created_at"]
    
    def __str__(self):
        return f"Fuel Prices ({self.effective_date}): Diesel {self.diesel_price_per_liter}€/L, AdBlue {self.adblue_price_per_liter}€/L"
    
    def save(self, *args, **kwargs):
        # Ensure only one current fuel prices
        if self.is_current:
            FuelPrices.objects.filter(is_current=True).update(is_current=False)
        super().save(*args, **kwargs)
    
    @classmethod
    def get_current_prices(cls):
        """Get the current fuel prices"""
        try:
            return cls.objects.get(is_current=True)
        except cls.DoesNotExist:
            return None


class TruckParameters(BaseTenantModel):
    """Default cost parameters for different truck types"""
    name = models.CharField(
        max_length=100,
        verbose_name="Truck Type Name",
        help_text="e.g., '20-ton Standard Tautliner'"
    )
    weight_capacity = models.PositiveIntegerField(
        verbose_name="Weight Capacity (tons)",
        help_text="Maximum weight capacity in tons"
    )
    truck_type = models.CharField(
        max_length=50,
        verbose_name="Truck Type",
        help_text="e.g., 'Tautliner', 'Refrigerator', 'Container'"
    )
    
    # Fuel consumption rates per 100km
    diesel_consumption_per_100km = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        verbose_name="Diesel Consumption per 100km",
        help_text="Diesel consumption in liters per 100 kilometers"
    )
    adblue_consumption_per_100km = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        verbose_name="AdBlue Consumption per 100km", 
        help_text="AdBlue consumption in liters per 100 kilometers"
    )
    
    # Other cost parameters per km
    tire_cost_per_km = models.DecimalField(
        max_digits=8, 
        decimal_places=4,
        verbose_name="Tire Cost per km",
        help_text="Tire wear cost per kilometer in EUR"
    )
    fixed_cost_per_km = models.DecimalField(
        max_digits=8, 
        decimal_places=4,
        verbose_name="Fixed Cost per km",
        help_text="Fixed costs (insurance, maintenance, etc.) per kilometer in EUR"
    )
    
    is_default = models.BooleanField(
        default=False,
        verbose_name="Default Parameters",
        help_text="Use as default truck parameters"
    )
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Truck Parameters"
        verbose_name_plural = "Truck Parameters"
        ordering = ["weight_capacity", "truck_type"]
    
    def __str__(self):
        return f"{self.name} ({self.weight_capacity}t {self.truck_type})"
    
    def save(self, *args, **kwargs):
        # Ensure only one default truck parameters
        if self.is_default:
            TruckParameters.objects.filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class RouteCalculation(BaseTenantModel):
    carrier = models.CharField(
        verbose_name="Company", 
        help_text="Name of the carrier company",
        max_length=255, 
        blank=True, 
        null=True
    )
    calculated_by = models.ForeignKey(
        'user.Profile',
        related_name="route_calculations",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    customer = models.CharField(
        verbose_name="Customer", 
        help_text="Name of the customer company",
        max_length=255,
        blank=True,
        null=True
    )
    # Can later be linked to created order
    # linked_order = models.OneToOneField(
	# 	    "orders.Order", 
	# 	    on_delete=models.SET_NULL,
	# 	    null=True, 
	# 	    blank=True,
    #     related_name="route_calculation"
	# 	)
    
    empty_distance_km = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    loaded_distance_km = models.DecimalField(max_digits=8, decimal_places=2)
    total_duration_h = models.DecimalField(max_digits=6, decimal_places=2)
    
    # Truck parameters used for this calculation
    truck_parameters = models.ForeignKey(
        TruckParameters,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Truck Parameters",
        help_text="Truck parameters used for cost calculation"
    )

    CURRENCIES = [
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('UAH', 'Ukrainian Hryvnia'),
        ('CZK', 'Czech Koruna'),
    ]

    currency = models.CharField(max_length=10, choices=CURRENCIES)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)

    diesel_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    adblue_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fuel_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    tire_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    direct_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    toll_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    fixed_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    margin = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    margin_percentage = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    
    profit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    profit_percentage = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Route Calculation"
        verbose_name_plural = "Route Calculations"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        from decimal import Decimal
        
        # Initialize all cost fields as Decimal to avoid type errors
        if not hasattr(self, 'diesel_cost') or self.diesel_cost is None:
            self.diesel_cost = Decimal('0')
        if not hasattr(self, 'adblue_cost') or self.adblue_cost is None:
            self.adblue_cost = Decimal('0')
        if not hasattr(self, 'tire_cost') or self.tire_cost is None:
            self.tire_cost = Decimal('0')
        
        if not hasattr(self, 'fixed_cost') or self.fixed_cost is None:
            self.fixed_cost = Decimal('0')
        if not hasattr(self, 'toll_cost') or self.toll_cost is None:
            self.toll_cost = Decimal('0')
        if not hasattr(self, 'direct_cost') or self.direct_cost is None:
            self.direct_cost = Decimal('0')
        
        # Calculate costs based on truck parameters and fuel prices if available
        if self.truck_parameters:
            # Ensure total_distance is a Decimal by converting each field individually
            loaded_distance = Decimal(str(self.loaded_distance_km))
            empty_distance = Decimal(str(self.empty_distance_km))
            total_distance = loaded_distance + empty_distance
            
            # Get current fuel prices
            fuel_prices = FuelPrices.get_current_prices()
            
            if fuel_prices:
                # Calculate fuel consumption and costs
                diesel_liters = (total_distance / Decimal('100')) * self.truck_parameters.diesel_consumption_per_100km
                adblue_liters = (total_distance / Decimal('100')) * self.truck_parameters.adblue_consumption_per_100km
                
                self.diesel_cost = diesel_liters * fuel_prices.diesel_price_per_liter
                self.adblue_cost = adblue_liters * fuel_prices.adblue_price_per_liter
            else:
                # Fallback: set fuel costs to 0 if no fuel prices available
                self.diesel_cost = Decimal('0')
                self.adblue_cost = Decimal('0')
            
            # Calculate other costs per km from truck parameters
            self.tire_cost = total_distance * self.truck_parameters.tire_cost_per_km
            self.fixed_cost = total_distance * self.truck_parameters.fixed_cost_per_km
        
        # Calculate fuel cost
        self.fuel_cost = self.diesel_cost + self.adblue_cost
        self.direct_cost = self.fuel_cost + self.tire_cost
        
        # Ensure all cost fields are Decimal before final calculation
        self.fuel_cost = Decimal(str(self.fuel_cost))
        self.tire_cost = Decimal(str(self.tire_cost))
        self.toll_cost = Decimal(str(self.toll_cost))
        self.direct_cost = Decimal(str(self.direct_cost))
        self.fixed_cost = Decimal(str(self.fixed_cost))
        
        # Calculate total cost
        self.total_cost = (
            self.direct_cost
            + self.toll_cost
            + self.fixed_cost
        )
        
        # Calculate margin and profit - ensure all values are Decimal
        price_decimal = Decimal(str(self.price)) if self.price is not None else Decimal('0')
        
        self.margin = price_decimal - self.direct_cost 
        
        # Calculate margin percentage with safety limits
        if price_decimal > 0:
            margin_pct = (self.margin / price_decimal) * 100
            # Cap at 99999.99% to prevent DataError
            self.margin_percentage = min(margin_pct, Decimal('99999.99'))
        else:
            self.margin_percentage = Decimal('0')
            
        self.profit = price_decimal - self.total_cost
        
        # Calculate profit percentage with safety limits
        if self.total_cost > 0:
            profit_pct = (self.profit / self.total_cost) * 100
            # Cap at 99999.99% to prevent DataError
            self.profit_percentage = min(profit_pct, Decimal('99999.99'))
        else:
            self.profit_percentage = Decimal('0')
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"RouteCalculation #{self.id} - {self.loaded_distance_km + self.empty_distance_km} km"
    
    @classmethod
    def get_default_truck_parameters(cls):
        """Get the default truck parameters"""
        try:
            return TruckParameters.objects.get(is_default=True)
        except TruckParameters.DoesNotExist:
            return None
    

class RouteToll(BaseTenantModel):
    route = models.ForeignKey(RouteCalculation, related_name="tolls", on_delete=models.CASCADE)
    country = models.CharField(max_length=3)  # ISO code like 'DEU'

    currency = models.CharField(max_length=3, choices=RouteCalculation.CURRENCIES, default="EUR")
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name="Toll Amount", 
        help_text="Amount of toll in the specified currency"
    )
    distance_km = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.country}: {self.amount} {self.currency}"


class RoutePoint(BaseTenantModel):
    route = models.ForeignKey(RouteCalculation, related_name="points", on_delete=models.CASCADE)
    country = models.CharField(max_length=3, blank=True, null=True)  # ISO code like 'DEU'
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    label = models.CharField(max_length=255, blank=True, null=True)

    date_from = models.DateField(blank=True, null=True)
    date_to = models.DateField(blank=True, null=True)

    lat = models.FloatField( verbose_name="Latitude", help_text="Latitude of the location")
    lng = models.FloatField( verbose_name="Longitude", help_text="Longitude of the location")

    customer = models.CharField(
        verbose_name="Customer", 
        help_text="Name of the customer company",
        max_length=255,
        blank=True,
        null=True
    )
    
    POINT_TYPE_CHOICES = [
        ("start", "Start"),
        ("loading", "Loading"),
        ("unloading", "Unloading"),
    ]
    point_type = models.CharField(max_length=20, choices=POINT_TYPE_CHOICES)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def save(self, *args, **kwargs):
        # Only update label if postal_code and city are provided
        if self.postal_code and self.city:
            self.label = f"{self.country}-{self.postal_code} {self.city}"
        # If label is not set, keep the original label from frontend
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.point_type} - {self.label}"