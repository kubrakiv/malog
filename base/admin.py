from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import (
    Client,
    Country,
    PointCompany,
    Truck,
    Trailer,
    Task,
    Customer,
    Order,
    TaskType,
    CustomerManager,
    TaskStatus,
    TaskStatusChange,
    PaymentType,
    Point,
    OrderFile,
    FileType,
    Platform,
    DriverAssignment,
    TrailerAssignment,
    Currency,
    CompanyBank,
    Company,
    Invoice,
    OrderStatus,
    OrderStatusHistory,
    Supplier,
    ExpenseCategory,
    Expense,
    ExpenseType,
    FuelPrice,
    SubscriptionPlan,
    ClientSubscription,
    SubscriptionUsage,
    SubscriptionPlanChangeRequest,
    ExternalAPIKey,
    ClientExternalIdentity,
)

User = get_user_model()

# Tenant-aware admin classes
class BaseTenantAdmin(admin.ModelAdmin):
    """
    Base admin class for tenant-scoped models
    """
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            # Superusers can see all clients
            return self.model.all_objects.all()
        elif hasattr(request.user, 'client') and request.user.client:
            # Regular users see only their client's data
            return qs.filter(client=request.user.client)
        else:
            # Users without clients see nothing
            return qs.none()

    def save_model(self, request, obj, form, change):
        if not change and hasattr(request.user, 'client') and request.user.client:
            # Auto-assign client for new objects
            obj.client = request.user.client
        super().save_model(request, obj, form, change)


# Inline admin classes for showing related data in Client admin
class ClientUserInline(admin.TabularInline):
    model = User
    fk_name = 'client'
    extra = 0
    can_delete = False
    readonly_fields = ('username', 'email', 'first_name', 'last_name', 'date_joined', 'last_login', 'is_active', 'is_staff', 'is_superuser')
    fields = ('username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_login')
    verbose_name = "User"
    verbose_name_plural = "Related Users"

    def has_add_permission(self, request, obj=None):
        return False  # Don't allow adding users directly from client admin


class ClientCompanyInline(admin.TabularInline):
    model = Company
    fk_name = 'client'
    extra = 0
    readonly_fields = ('name', 'email', 'phone', 'created_at')
    fields = ('name', 'email', 'phone', 'created_at')
    verbose_name = "Company"
    verbose_name_plural = "Related Companies"

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'get_user_count', 'get_company_count', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ClientUserInline, ClientCompanyInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'is_active')
        }),
        ('Settings', {
            'fields': ('settings',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')

    def get_user_count(self, obj):
        return obj.users.count()
    get_user_count.short_description = 'Users'

    def get_company_count(self, obj):
        # Use the reverse lookup through the Company model
        return Company.objects.filter(client=obj).count()
    get_company_count.short_description = 'Companies'

    



@admin.register(ClientExternalIdentity)
class ClientExternalIdentityAdmin(admin.ModelAdmin):
    list_display = (
        'client',
        'provider',
        'external_client_id',
        'link_status',
        'link_key',
        'linked_at',
        'linked_by',
    )
    list_filter = ('provider', 'link_status', 'linked_at')
    search_fields = ('client__name', 'client__slug', 'external_client_id', 'link_key')
    readonly_fields = ('created_at', 'updated_at', 'link_key', 'linked_at', 'linked_by')


@admin.register(Company)
class CompanyAdmin(BaseTenantAdmin):
    list_display = ('name', 'client', 'email', 'phone')
    list_filter = ('client',)
    search_fields = ('name', 'email')


@admin.register(Customer)
class CustomerAdmin(BaseTenantAdmin):
    list_display = ('name', 'client', 'email', 'created_at')
    list_filter = ('client', 'created_at')
    search_fields = ('name', 'email')


@admin.register(Truck)
class TruckAdmin(BaseTenantAdmin):
    list_display = ('plates', 'client', 'brand', 'model', 'driver')
    list_filter = ('client', 'brand')
    search_fields = ('plates', 'brand', 'model')


@admin.register(Trailer)
class TrailerAdmin(BaseTenantAdmin):
    list_display = ('plates', 'client', 'brand', 'entry_date')
    list_filter = ('client', 'brand')
    search_fields = ('plates', 'brand')


@admin.register(Order)
class OrderAdmin(BaseTenantAdmin):
    list_display = ('number', 'client', 'customer', 'price', 'current_status', 'created_at')
    list_filter = ('client', 'current_status', 'created_at')
    search_fields = ('number', 'order_number', 'customer__name')


# Register other models with appropriate admin classes
admin.site.register(Country)
admin.site.register(PointCompany)
admin.site.register(PaymentType)
admin.site.register(CustomerManager)
admin.site.register(TaskType)
admin.site.register(TaskStatus)
admin.site.register(OrderFile)
admin.site.register(FileType)
admin.site.register(Platform)
admin.site.register(DriverAssignment)
admin.site.register(TrailerAssignment)
admin.site.register(Currency)
admin.site.register(CompanyBank)
admin.site.register(Invoice)
admin.site.register(Supplier)
admin.site.register(ExpenseCategory)
admin.site.register(ExpenseType)
admin.site.register(Expense)

admin.site.register(OrderStatusHistory)
# admin.site.register(FuelPrice)


class OrderStatusAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "description"]
    readonly_fields = ["id"]
    fields = ["id", "name", "description"]

admin.site.register(OrderStatus, OrderStatusAdmin)


class TaskStatusChangeAdmin(admin.ModelAdmin):
    list_display = [
        "task",
        "status",
        "start_date",
        "start_time",
        "end_date",
        "end_time",
        "is_active",
    ]
    #   fields = ['task', 'status', 'start_date', 'start_time', 'end_date', 'end_time', 'is_active']
    readonly_fields = ["start_date", "start_time"]


admin.site.register(TaskStatusChange, TaskStatusChangeAdmin)


class PointAdmin(admin.ModelAdmin):
    readonly_fields = ["id"]
    list_display = [
        "id",
        "postal_code",
        "country",
        "city",
        "street",
        "street_number",
        "gps_latitude",
        "gps_longitude",
        "company_name",
        "customer",
        "created_at",
    ]

admin.site.register(Point, PointAdmin)


class TaskAdmin(admin.ModelAdmin):
    readonly_fields = ["id"]
    list_display = ["id", "type", "title", "truck", "driver", "order",  "point", "status"]


admin.site.register(Task, TaskAdmin)

# Note: Order and Truck are already registered above with BaseTenantAdmin classes


class FuelPriceAdmin(admin.ModelAdmin):
    readonly_fields = ["id"]
    list_display = ["id", "fuel_type", "price_per_liter", "effective_from"]


class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'name', 'monthly_price', 'yearly_price', 'truck_limit', 'is_active']
    list_filter = ['is_active', 'truck_limit']
    search_fields = ['name', 'display_name']
    readonly_fields = ['created_at', 'updated_at']


class ClientSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['client', 'plan', 'status', 'billing_cycle', 'start_date', 'end_date']
    list_filter = ['status', 'billing_cycle', 'plan']
    search_fields = ['client__name']
    readonly_fields = ['created_at', 'updated_at']


class SubscriptionPlanChangeRequestAdmin(admin.ModelAdmin):
    list_display = ['client', 'current_plan', 'requested_plan', 'status', 'requested_at', 'reviewed_by']
    list_filter = ['status', 'requested_at', 'reviewed_at']
    search_fields = ['client__name', 'reason']
    readonly_fields = ['requested_at', 'reviewed_at']
    
    def current_plan(self, obj):
        return obj.current_subscription.plan.display_name
    current_plan.short_description = 'Current Plan'
    
    actions = ['approve_requests', 'reject_requests']
    
    def approve_requests(self, request, queryset):
        for change_request in queryset.filter(status='pending'):
            try:
                change_request.approve(request.user, "Approved via admin bulk action")
                self.message_user(request, f"Approved plan change for {change_request.client.name}")
            except Exception as e:
                self.message_user(request, f"Error approving {change_request.client.name}: {str(e)}", level='ERROR')
    approve_requests.short_description = "Approve selected plan change requests"
    
    def reject_requests(self, request, queryset):
        for change_request in queryset.filter(status='pending'):
            try:
                change_request.reject(request.user, "Rejected via admin bulk action")
                self.message_user(request, f"Rejected plan change for {change_request.client.name}")
            except Exception as e:
                self.message_user(request, f"Error rejecting {change_request.client.name}: {str(e)}", level='ERROR')
    reject_requests.short_description = "Reject selected plan change requests"


admin.site.register(FuelPrice, FuelPriceAdmin)
admin.site.register(SubscriptionPlan, SubscriptionPlanAdmin)
admin.site.register(ClientSubscription, ClientSubscriptionAdmin)
admin.site.register(SubscriptionUsage)
admin.site.register(SubscriptionPlanChangeRequest, SubscriptionPlanChangeRequestAdmin)


# External API Key Admin
@admin.register(ExternalAPIKey)
class ExternalAPIKeyAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'usage_count', 'last_used_at', 'created_at', 'expires_at', 'masked_key']
    list_filter = ['is_active', 'created_at', 'last_used_at']
    search_fields = ['name', 'description', 'key']
    readonly_fields = ['key', 'created_at', 'updated_at', 'usage_count', 'last_used_at', 'created_by']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'key', 'is_active')
        }),
        ('Access Control', {
            'fields': ('rate_limit', 'allowed_endpoints', 'ip_whitelist')
        }),
        ('Expiration', {
            'fields': ('expires_at',)
        }),
        ('Usage Statistics', {
            'fields': ('usage_count', 'last_used_at', 'created_by', 'created_at', 'updated_at')
        }),
    )
    
    def masked_key(self, obj):
        """Display masked API key for security"""
        if obj.key:
            return f"{obj.key[:10]}...{obj.key[-6:]}"
        return "N/A"
    masked_key.short_description = 'API Key (Masked)'
    
    def save_model(self, request, obj, form, change):
        """Set the created_by field when creating a new API key"""
        if not change:  # Only set created_by when creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def has_delete_permission(self, request, obj=None):
        """Only superusers can delete API keys"""
        return request.user.is_superuser
    
    actions = ['deactivate_keys', 'activate_keys']
    
    def deactivate_keys(self, request, queryset):
        """Bulk deactivate selected API keys"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Deactivated {updated} API key(s)")
    deactivate_keys.short_description = "Deactivate selected API keys"
    
    def activate_keys(self, request, queryset):
        """Bulk activate selected API keys"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f"Activated {updated} API key(s)")
    activate_keys.short_description = "Activate selected API keys"