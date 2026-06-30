from django.contrib import admin
from base.admin import BaseTenantAdmin
from .models import RouteCalculation, RouteToll, RoutePoint, TruckParameters, FuelPrices


class RouteTollInline(admin.TabularInline):
    model = RouteToll
    extra = 0
    fields = ['country', 'currency', 'amount', 'distance_km']


class RoutePointInline(admin.TabularInline):
    model = RoutePoint
    extra = 0
    fields = ['point_type', 'order', 'label', 'country', 'lat', 'lng', 'customer']
    ordering = ['order']


@admin.register(RouteCalculation)
class RouteCalculationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'created_at', 'carrier', 'customer', 'calculated_by',
        'total_distance_display', 'total_duration_h', 'toll_cost', 'total_cost'
    ]
    list_filter = ['created_at', 'currency', 'calculated_by']
    search_fields = ['carrier', 'customer']
    readonly_fields = [
        'fuel_cost', 'total_cost', 'margin', 'margin_percentage', 
        'profit', 'profit_percentage', 'created_at'
    ]
    inlines = [RoutePointInline, RouteTollInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('carrier', 'customer', 'calculated_by', 'created_at')
        }),
        ('Route Details', {
            'fields': ('empty_distance_km', 'loaded_distance_km', 'total_duration_h')
        }),
        ('Financial Information', {
            'fields': ('currency', 'price', 'diesel_cost', 'adblue_cost', 'fuel_cost')
        }),
        ('Cost Breakdown', {
            'fields': ('tire_cost', 'direct_cost', 'toll_cost', 'fixed_cost', 'total_cost')
        }),
        ('Profit Analysis', {
            'fields': ('margin', 'margin_percentage', 'profit', 'profit_percentage')
        }),
    )
    
    def total_distance_display(self, obj):
        return f"{obj.loaded_distance_km + obj.empty_distance_km} km"
    total_distance_display.short_description = 'Total Distance'


@admin.register(RouteToll)
class RouteTollAdmin(admin.ModelAdmin):
    list_display = ['route', 'country', 'currency', 'amount', 'distance_km']
    list_filter = ['country', 'currency', 'route__created_at']
    search_fields = ['route__carrier', 'route__customer', 'country']


@admin.register(RoutePoint)
class RoutePointAdmin(admin.ModelAdmin):
    list_display = ['route', 'point_type', 'order', 'label', 'country', 'lat', 'lng']
    list_filter = ['point_type', 'country', 'route__created_at']
    search_fields = ['label', 'route__carrier', 'route__customer', 'country']
    ordering = ['route', 'order']


@admin.register(TruckParameters)
class TruckParametersAdmin(BaseTenantAdmin):
    list_display = ['name', 'client', 'weight_capacity', 'truck_type', 'is_default', 'diesel_consumption_per_100km', 'adblue_consumption_per_100km', 'tire_cost_per_km', 'fixed_cost_per_km']
    list_filter = ['client', 'weight_capacity', 'truck_type', 'is_default']
    search_fields = ['name', 'truck_type']
    ordering = ['weight_capacity', 'truck_type']

    fieldsets = (
        ('Tenant', {
            'fields': ('client',),
        }),
        ('Basic Information', {
            'fields': ('name', 'weight_capacity', 'truck_type', 'is_default')
        }),
        ('Fuel Consumption (per 100km)', {
            'fields': ('diesel_consumption_per_100km', 'adblue_consumption_per_100km'),
            'description': 'Fuel consumption rates in liters per 100 kilometers'
        }),
        ('Other Cost Parameters (per km)', {
            'fields': ('tire_cost_per_km', 'fixed_cost_per_km', 'admin_cost_per_km', 'leasing_cost_per_km', 'insurance_cost_per_km'),
            'description': 'Cost parameters per kilometer in EUR'
        }),
    )


@admin.register(FuelPrices)
class FuelPricesAdmin(BaseTenantAdmin):
    list_display = ['effective_date', 'client', 'diesel_price_per_liter', 'adblue_price_per_liter', 'currency', 'is_current', 'created_at']
    list_filter = ['client', 'currency', 'is_current', 'effective_date']
    search_fields = ['currency']
    ordering = ['-effective_date', '-created_at']

    fieldsets = (
        ('Tenant', {
            'fields': ('client',),
        }),
        ('Price Information', {
            'fields': ('diesel_price_per_liter', 'adblue_price_per_liter', 'currency')
        }),
        ('Status', {
            'fields': ('is_current', 'effective_date'),
            'description': 'Mark as current prices and set effective date'
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(super().get_readonly_fields(request, obj))
        readonly_fields.extend(['created_at', 'updated_at'])
        return readonly_fields