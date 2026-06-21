import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models import IntegerField, Q
from django.db.models.functions import Cast, Substr, Length
from user.models import DriverProfile, LogistProfile
from django.core.exceptions import ObjectDoesNotExist
from .managers import TenantManager, GlobalManager, TenantRelatedManager
from .tenant import get_current_client


# Create your models here.

class BaseTenantModel(models.Model):
    """
    Abstract base model for all tenant-scoped models
    """
    client = models.ForeignKey(
        'base.Client',
        on_delete=models.CASCADE,
        help_text="Client that owns this record"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TenantManager()
    all_objects = GlobalManager()  # Use this for admin operations that need to see all clients

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        # Auto-assign current client if not set
        if not self.client_id and not kwargs.get('skip_client_assignment'):
            current_client = get_current_client()
            if current_client:
                self.client = current_client
        super().save(*args, **kwargs)

class Client(models.Model):
    """
    Client model - the main tenant entity that provides data isolation
    """
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, help_text="Unique identifier for the client")
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_approved = models.BooleanField(default=False, help_text="Client has been approved by system admin")
    approval_status = models.CharField(
        max_length=20, choices=APPROVAL_STATUS_CHOICES, default='pending',
        help_text="Current approval status"
    )
    approved_at = models.DateTimeField(null=True, blank=True, help_text="When the client was approved/rejected")
    rejection_reason = models.TextField(null=True, blank=True, help_text="Reason for rejection if applicable")
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_clients',
        help_text="System admin who approved/rejected this client"
    )

    is_onboarded = models.BooleanField(default=False, help_text="Client has completed the onboarding wizard")
    onboarded_at = models.DateTimeField(null=True, blank=True, help_text="When the client completed onboarding")
    planner_tutorial_shown = models.BooleanField(default=False, help_text="Planner tutorial has been shown to client users")

    settings = models.JSONField(default=dict, blank=True, help_text="Client-specific configuration")

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class APIToken(models.Model):
    token = models.TextField()

    @staticmethod
    def get_token():
        """
        Retrieves the latest token from the database, or returns None if none exists.
        """
        token_entry = APIToken.objects.first()
        return token_entry.token if token_entry else None

    @staticmethod
    def update_token(token):
        """
        Updates the token in the database.
        """
        APIToken.objects.all().delete()  # Clear any existing tokens
        APIToken.objects.create(token=token)


class CompanyBank(BaseTenantModel):
    company = models.ForeignKey(
        'Company',
        related_name='banks',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255)
    bank_address = models.CharField(max_length=250, null=True, blank=True)
    iban_cz = models.CharField(max_length=50, null=True, blank=True)
    iban_eur = models.CharField(max_length=50, null=True, blank=True)
    account_number_cz = models.CharField(max_length=50, null=True, blank=True)
    account_number_eur = models.CharField(max_length=50, null=True, blank=True)
    swift_code = models.CharField(max_length=50, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Company(BaseTenantModel):
    name = models.CharField(max_length=255)
    nip_number = models.CharField(max_length=50, null=True, blank=True)
    vat_number = models.CharField(max_length=50, null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField("Email Billing", max_length=255, null=True, blank=True)
    website = models.CharField(max_length=250, null=True, blank=True)
    post_address = models.CharField(max_length=250, null=True, blank=True)
    legal_address = models.CharField(max_length=250, null=True, blank=True)
    name_en = models.CharField(max_length=255, null=True, blank=True)
    bank = models.ForeignKey(
        CompanyBank,
        related_name="companies",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    

    def __str__(self):
        return self.name
    
class Country(models.Model):
    name = models.CharField(max_length=25)
    short_name = models.CharField(max_length=3)

    class Meta:
        verbose_name_plural = "Countries"

    def __str__(self):
        return self.name
    

class Currency(models.Model):
    name = models.CharField(max_length=25)
    short_name = models.CharField(max_length=3)

    class Meta:
        verbose_name_plural = "Currencies"

    def __str__(self):
        return self.short_name


class PointCompany(BaseTenantModel):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name
    

class FuelPrice(BaseTenantModel):
    FUEL_TYPES = [
        ('diesel', 'Diesel'),
        ('adblue', 'AdBlue'),
    ]

    fuel_type = models.CharField(max_length=10, choices=FUEL_TYPES)
    price_per_liter = models.DecimalField(max_digits=6, decimal_places=3)
    effective_from = models.DateField()

    class Meta:
        unique_together = ('fuel_type', 'effective_from')

    def __str__(self):
        return f"{self.fuel_type} - {self.price_per_liter} EUR from {self.effective_from}"


class Trailer(BaseTenantModel):
    plates = models.CharField(max_length=25)
    brand = models.CharField(max_length=50, null=True, blank=True)
    entry_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    vin_code = models.CharField(max_length=50, null=True, blank=True)
    year = models.IntegerField(null=True, blank=True)
    entry_mileage = models.CharField(max_length=50, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sovtes_id = models.CharField(max_length=100, null=True, blank=True)
    is_removed = models.BooleanField(default=False)
    is_removed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Trailer plates: {self.plates}"


class Truck(BaseTenantModel):
    plates = models.CharField(max_length=25)
    brand = models.CharField(max_length=50, null=True, blank=True)
    model = models.CharField(max_length=50, null=True, blank=True)
    entry_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    vin_code = models.CharField(max_length=50, null=True, blank=True)
    year = models.IntegerField(null=True, blank=True)
    entry_mileage = models.CharField(max_length=50, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    gps_id = models.CharField(max_length=50, null=True, blank=True)
    sovtes_id = models.CharField(max_length=100, null=True, blank=True)
    diesel_norm = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Liters of Diesel per 100 km"
    )
    adblue_norm = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Liters of AdBlue per 100 km"
    )
    tire_cost_per_km = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Tire cost in EUR per kilometer (шини, євро/км)"
    )
    
    driver = models.ForeignKey(
        DriverProfile,
        related_name="trucks",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    trailer = models.ForeignKey(
        Trailer,
        related_name="trucks",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    logist = models.ForeignKey(
        LogistProfile,
        related_name="trucks",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    is_removed = models.BooleanField(default=False)
    is_removed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Truck plates: {self.plates}"


class DriverAssignment(BaseTenantModel):
    truck = models.ForeignKey(Truck, on_delete=models.CASCADE)
    driver_profile = models.ForeignKey(DriverProfile, on_delete=models.CASCADE)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        start_date_str = self.start_date.strftime("%Y-%m-%d %H:%M") if self.start_date else "N/A"
        end_date_str = self.end_date.strftime("%Y-%m-%d %H:%M") if self.end_date else "present"
        return f"{self.driver_profile.full_name} assigned to {self.truck.plates} from {start_date_str} to {end_date_str}"


class TrailerAssignment(BaseTenantModel):
    truck = models.ForeignKey(Truck, on_delete=models.CASCADE)
    trailer = models.ForeignKey(Trailer, on_delete=models.CASCADE)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        start_date_str = self.start_date.strftime("%Y-%m-%d %H:%M") if self.start_date else "N/A"
        end_date_str = self.end_date.strftime("%Y-%m-%d %H:%M") if self.end_date else "present"
        return f"{self.trailer.plates} assigned to {self.truck.plates} from {start_date_str} to {end_date_str}"


class TruckUnit(BaseTenantModel):
    """A named fleet column/unit (e.g. Міжнародна колона) that trucks can belong to."""
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class TruckUnitAssignment(BaseTenantModel):
    """Tracks which TruckUnit a truck belongs to over time."""
    truck = models.ForeignKey(
        Truck, on_delete=models.CASCADE, related_name="unit_assignments"
    )
    unit = models.ForeignKey(
        TruckUnit, on_delete=models.CASCADE, related_name="truck_assignments"
    )
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        end = self.end_date.strftime("%Y-%m-%d") if self.end_date else "present"
        return f"{self.truck.plates} → {self.unit.name} ({self.start_date.strftime('%Y-%m-%d')} – {end})"


class PaymentType(BaseTenantModel):
    name = models.CharField(max_length=25)

    def __str__(self):
        return self.name


class Platform(BaseTenantModel):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class Customer(BaseTenantModel):
    name = models.CharField(max_length=255)
    nip_number = models.CharField(max_length=50, null=True, blank=True)
    vat_number = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField("Email Billing", max_length=255, null=True, blank=True)
    website = models.CharField(max_length=255, null=True, blank=True)
    post_address = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.name


class CustomerManager(BaseTenantModel):
    full_name = models.CharField(max_length=255)
    position = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(max_length=255, null=True, blank=True)
    customer = models.ForeignKey(
        Customer,
        related_name="managers",
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return self.full_name + " " + self.customer.name


class Point(BaseTenantModel):
    country = models.ForeignKey(
        Country, related_name="points", on_delete=models.SET_NULL, null=True, blank=True
    )
    postal_code = models.CharField(max_length=25, null=True, blank=True)
    city = models.CharField(max_length=255)
    street = models.CharField(max_length=255)
    street_number = models.CharField(max_length=25)
    gps_latitude = models.CharField(max_length=50, null=True, blank=True)
    gps_longitude = models.CharField(max_length=50, null=True, blank=True)
    company_name = models.ForeignKey(
        PointCompany,
        related_name="points",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    customer = models.ForeignKey(
        Customer,
        related_name="points",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )

    class Meta:
        verbose_name_plural = "Points"

    def __str__(self):
        if (
            self.customer
            and self.country
            and self.city
            and self.street
            and self.street_number
        ):
            return f"{self.customer.name}: {self.country.short_name}, {self.city}, {self.street}, {self.street_number}"
        else:
            return f"{self.id} {self.created_at}"


class OrderStatus(BaseTenantModel):
    name = models.CharField(max_length=50)
    description = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "Order Statuses"

    def __str__(self):
        return self.name


class Order(BaseTenantModel):
    number = models.CharField(max_length=20)  # auto-incremented number
    order_number = models.CharField(
        "Order number", max_length=20, null=True, blank=True
    )  # manual order number
    price = models.DecimalField(
        "Order price", max_digits=7, decimal_places=2, null=True, blank=True
    )
    market_price = models.DecimalField(
        "Market price", max_digits=7, decimal_places=2, null=True, blank=True
    )
    payment_type = models.ForeignKey(
        PaymentType,
        related_name="orders",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    currency = models.ForeignKey(
        Currency,
        related_name="orders",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    vat = models.BooleanField(default=False, null=True, blank=True, verbose_name="VAT", help_text="Value Added Tax")
    payment_period = models.IntegerField(null=True, blank=True)
    route = models.CharField(max_length=255, null=True, blank=True)
    empty_distance = models.IntegerField(null=True, blank=True)
    distance = models.IntegerField(null=True, blank=True)
    tolls = models.DecimalField(
        "Tolls", max_digits=10, decimal_places=2, null=True, blank=True
    )
    cargo_name = models.CharField(max_length=50, null=True, blank=True)
    cargo_weight = models.CharField(max_length=50, null=True, blank=True)
    loading_type = models.CharField(max_length=50, null=True, blank=True)
    trailer_type = models.CharField(max_length=50, null=True, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="orders",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    platform = models.ForeignKey(
        Platform,
        related_name="orders",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    customer = models.ForeignKey(
        Customer,
        related_name="orders",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    customer_manager = models.ForeignKey(
        CustomerManager,
        related_name="orders",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    truck = models.ForeignKey(
        Truck, related_name="orders", on_delete=models.SET_NULL, null=True, blank=True
    )
    driver = models.ForeignKey(
        DriverProfile, related_name="orders", on_delete=models.SET_NULL, null=True, blank=True
    )
    current_status = models.ForeignKey(OrderStatus, on_delete=models.SET_NULL, null=True, related_name="current_orders")
    notice = models.TextField(blank=True, null=True, help_text="Order notice/comment")

    def set_status(self, new_status):
        """
        Update the current_status field and add an entry to status_history.
        """
        if self.current_status != new_status:
            # Update current_status
            self.current_status = new_status
            self.save()

    def save(self, *args, **kwargs):
        if not self.id and not self.current_status:
            default_status, _ = OrderStatus.objects.get_or_create(name='created', defaults={'description': 'Order created.'})
            self.current_status = default_status

        if not self.number:
            # Calculate the auto-increasing number for the month
            current_month = timezone.now().month
            current_year = timezone.now().year

            last_order = (
                Order.objects.annotate(
                    number_int=Cast(
                        Substr("number", 1, Length("number") - 6), IntegerField()
                    )
                )
                .filter(
                    number__isnull=False,
                    created_at__month=current_month,
                    created_at__year=current_year,
                )
                .order_by("-number_int")
                .first()
            )

            if last_order:
                new_number = last_order.number_int + 1
            else:
                new_number = 1

            # Format the number field
            month_str = str(current_month).zfill(2)
            year_str = str(current_year)[-2:]
            self.number = f"{new_number}-{month_str}-{year_str}"

        super().save(*args, **kwargs)
        
        # Generate route after saving (so we have an ID and can access related tasks)
        self._generate_route()

    def _generate_route(self):
        """
        Generate route string based on order tasks.
        Format: Loading1 - Loading2 -> Unloading1 - Unloading2
        Uses task titles and groups by task type for this specific order only
        """
        try:
            # Get loading tasks for THIS order only, ordered by date/time
            # Use iexact to avoid matching "Unloading" which contains "loading"
            loading_tasks = self.tasks.filter(
                type__name__iexact='loading'
            ).order_by('start_date', 'start_time', 'id')
            
            # Get unloading tasks for THIS order only, ordered by date/time  
            unloading_tasks = self.tasks.filter(
                type__name__iexact='unloading'
            ).order_by('start_date', 'start_time', 'id')
            
            if not loading_tasks.exists() and not unloading_tasks.exists():
                return
            
            route_parts = []
            
            # Collect loading tasks
            if loading_tasks.exists():
                loading_titles = []
                for task in loading_tasks:
                    if task.title and task.title.strip():
                        loading_titles.append(task.title.strip())
                
                if loading_titles:
                    loading_part = " - ".join(loading_titles)
                    route_parts.append(loading_part)
            
            # Collect unloading tasks
            if unloading_tasks.exists():
                unloading_titles = []
                for task in unloading_tasks:
                    if task.title and task.title.strip():
                        unloading_titles.append(task.title.strip())
                
                if unloading_titles:
                    unloading_part = " - ".join(unloading_titles)
                    route_parts.append(unloading_part)
            
            if route_parts:
                # Join loading and unloading groups with " -> "
                new_route = " -> ".join(route_parts)
                
                # Only update if route has changed to avoid infinite recursion
                if self.route != new_route:
                    Order.objects.filter(id=self.id).update(route=new_route)
                    
        except Exception as e:
            # Log the error but don't break the save process
            print(f"Error generating route for order {self.id}: {e}")


    def regenerate_route(self):
        """
        Manually regenerate the route for this order.
        Useful for updating existing orders or when tasks are modified.
        """
        self._generate_route()
        
    @classmethod
    def regenerate_all_routes(cls):
        """
        Regenerate routes for all orders.
        Useful for bulk updates after implementing the new route logic.
        """
        orders = cls.objects.all()
        updated_count = 0
        
        for order in orders:
            old_route = order.route
            order._generate_route()
            order.refresh_from_db()
            
            if order.route != old_route:
                updated_count += 1
                
        return updated_count

    def __str__(self):
        return f"Order number: {self.number}, created at: {str(self.created_at)[0:19]}"
    

class OrderStatusHistory(BaseTenantModel):
    order = models.ForeignKey(
        Order, related_name="status_history", on_delete=models.CASCADE
    )
    status = models.ForeignKey(
        OrderStatus, related_name="status_history", on_delete=models.CASCADE       
    )
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        started_at_str = self.started_at.strftime("%Y-%m-%d %H:%M") if self.started_at else "N/A"
        ended_at_str = self.ended_at.strftime("%Y-%m-%d %H:%M") if self.ended_at else "present"
        return f"{self.order.number} with status {self.status} from {started_at_str} to {ended_at_str}"


class FileType(BaseTenantModel):
    name = models.CharField(max_length=25)

    def __str__(self):
        return self.name


class OrderFile(BaseTenantModel):
    order = models.ForeignKey(
        Order,
        related_name="order_files",
        on_delete=models.CASCADE
    )
    file_type = models.ForeignKey(
        FileType,
        related_name="file_type",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    file = models.FileField(upload_to='order_files/', null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file_type.name} - File Name: {self.file.name[12:]}, Uploaded at: {str(self.uploaded_at)[0:19]}"


class TaskType(BaseTenantModel):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class TaskStatus(BaseTenantModel):
    name = models.CharField(max_length=50)

    class Meta:
        verbose_name_plural = "Task Statuses"

    def __str__(self):
        return f"{self.id} - {self.name}"


class Task(BaseTenantModel):
    title = models.CharField(max_length=255, blank=True, null=True)
    start_date = models.DateField(auto_now_add=False, null=True, blank=True)
    start_time = models.TimeField(auto_now_add=False, null=True, blank=True)
    end_date = models.DateField(auto_now_add=False, null=True, blank=True)
    end_time = models.TimeField(auto_now_add=False, null=True, blank=True)
    external_id = models.CharField(max_length=50, null=True, blank=True)
    order = models.ForeignKey(
        Order, related_name="tasks", on_delete=models.CASCADE, blank=True, null=True
    )
    point = models.ForeignKey(
        Point, related_name="tasks", on_delete=models.SET_NULL, blank=True, null=True
    )
    truck = models.ForeignKey(
        Truck, related_name="tasks", on_delete=models.CASCADE, null=True, blank=True
    )
    driver = models.ForeignKey(
        DriverProfile, related_name="tasks", on_delete=models.CASCADE, null=True, blank=True
    )
    type = models.ForeignKey(
        TaskType, related_name="tasks", on_delete=models.CASCADE
    )
    status = models.ForeignKey(
        TaskStatus,
        related_name="tasks",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )


    def __str__(self):
        return f"{self.id}: {self.title}"

    def save(self, *args, **kwargs):
        # Flag to track if the task is new
        is_new = self._state.adding

        # Variables to hold previous status
        previous_status = None
        if not is_new:
            try:
                previous_status = self.__class__.objects.get(pk=self.pk).status
            except ObjectDoesNotExist:
                # Handle the case where the Task instance doesn't exist
                pass

        super().save(*args, **kwargs)  # Save the instance first

        # Check if the status has changed (only for existing tasks)
        if not is_new and self.status != previous_status:
            # Update the end_date and end_time for the last TaskStatusChange record
            last_status_change = self.status_changes.filter(
                end_date__isnull=True
            ).first()
            if last_status_change:
                last_status_change.end_date = timezone.now().date()
                last_status_change.end_time = timezone.now().time()
                last_status_change.is_active = False
                last_status_change.save()

            # Additional logic for specific status changes
            # (Adapt this part as per your application logic)
            if self.status.name == "Розвантаження завершено":
                last_loading_status_change = self.status_changes.filter(
                    status__name="Розвантаження завершено", end_date__isnull=True
                ).first()
                if last_loading_status_change:
                    last_loading_status_change.end_date = timezone.now().date()
                    last_loading_status_change.end_time = timezone.now().time()
                    last_loading_status_change.is_active = False
                    last_loading_status_change.save()

            # Create a new TaskStatusChange record for the new status
            TaskStatusChange.objects.create(task=self, status=self.status)


class TaskStatusChange(BaseTenantModel):
    task = models.ForeignKey(
        Task, related_name="status_changes", on_delete=models.CASCADE
    )
    status = models.ForeignKey(
        TaskStatus,
        related_name="status_changes",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    start_date = models.DateField(auto_now_add=True)
    start_time = models.TimeField(auto_now_add=True)
    end_date = models.DateField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Task #{self.task.id}: {self.task.title} - {self.status.name} - {self.start_date} {self.start_time}"


class Invoice(BaseTenantModel):
    number = models.CharField(max_length=20)  # auto-incremented number
    service_name = models.CharField(max_length=255, null=True, blank=True)
    truck = models.CharField(max_length=255, null=True, blank=True)
    trailer = models.CharField(max_length=55, null=True, blank=True)
    loading_date = models.CharField(max_length=55, null=True, blank=True)
    unloading_date = models.CharField(max_length=55, null=True, blank=True)
    order_number = models.CharField(
        "Order number", max_length=20, null=True, blank=True
    )  # manual order number
    company = models.ForeignKey(
        Company,
        related_name="invoices",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    order = models.OneToOneField(
        Order, 
        related_name="invoice", 
        on_delete=models.CASCADE, 
        null=True,
        blank=True,
    )
    price = models.DecimalField(
        "Invoice price", max_digits=10, decimal_places=2, null=True, blank=True
    )
    vat = models.DecimalField(
        "VAT", max_digits=10, decimal_places=2, null=True, blank=True
    )
    total_price = models.DecimalField(
        "Total price", max_digits=10, decimal_places=2, null=True, blank=True
    )
    currency = models.ForeignKey(
        Currency,
        related_name="invoices",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    currency_rate = models.DecimalField(
        "Currency rate", max_digits=6, decimal_places=3, null=True, blank=True
    )
    customer = models.ForeignKey(
        Customer,
        related_name="invoices",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    invoicing_date = models.DateField(null=True, blank=True)
    vat_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    send_date = models.DateField(null=True, blank=True)
    accepted_date = models.DateField(null=True, blank=True)
    payment_date = models.DateField(null=True, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="invoices",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    def save(self, *args, **kwargs):
        if not self.number:
            # Get the current year
            current_year = timezone.now().year

            # Find the last invoice number for the current year
            last_invoice = (
                Invoice.objects.annotate(
                    number_int=Cast(
                        Substr("number", 3, 9), IntegerField()
                    )
                )
                .filter(
                    number__isnull=False,
                    created_at__year=current_year,
                )
                .order_by("-number_int")
                .first()
            )

            if last_invoice and last_invoice.number_int:
                new_number = last_invoice.number_int + 1
            else:
                new_number = 1

            # Format the number field with DL prefix and zero-padded 9-digit number
            self.number = f"DL{str(new_number).zfill(9)}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invoice number: {self.number}, created at: {str(self.created_at)[0:19]}"


class Supplier(BaseTenantModel):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

class ExpenseCategory(BaseTenantModel):
    name = models.CharField(max_length=50)  # e.g. "Змінні витрати", "Постійні витрати", 
    
    class Meta:
        verbose_name_plural = "Expense Categories"

    def __str__(self):
        return self.name
    

class ExpenseType(BaseTenantModel):
    name = models.CharField(max_length=100)  # e.g. "Пальне ДП", "Пальне А95", "Шини", "Ремонт", "Страхування", "Митні платежі"
    category = models.ForeignKey(
        ExpenseCategory,
        related_name="expense_types",
        on_delete=models.CASCADE
    )

    def __str__(self):
        return f"{self.category.name} - {self.name}"
    

class Expense(BaseTenantModel):
    expense_type = models.ForeignKey(
        ExpenseType,
        related_name="expenses",
        on_delete=models.CASCADE
    )
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    country = models.TextField(blank=True, null=True, help_text="Used for toll or country-specific expenses")

    # Supplier
    supplier = models.ForeignKey(
        Supplier,
        related_name="expenses",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    # Price-related fields
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Quantity of goods or services (e.g. liters of fuel)"
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Unit price in original currency"
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Total amount in original currency (auto-calculated if quantity and unit_price present)"
    )
    currency = models.ForeignKey(
        Currency,
        related_name="expenses",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    currency_rate = models.DecimalField(
        max_digits=6,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Currency rate to EUR at time of expense"
    )
    amount_eur = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Converted amount in EUR"
    )
    
    # Associations
    order = models.ForeignKey(
        Order,
        related_name="expenses",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    truck = models.ForeignKey(
        Truck,
        related_name="expenses",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    driver = models.ForeignKey(
        DriverProfile,
        related_name="expenses",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    trailer = models.ForeignKey(
        Trailer,
        related_name="expenses",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    company = models.ForeignKey(
        Company,
        related_name="expenses",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="created_expenses",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    def save(self, *args, **kwargs):
        # Auto-calculate amount from quantity and unit_price if not provided
        if self.quantity and self.unit_price:
            self.amount = self.quantity * self.unit_price

        # Auto-calculate EUR equivalent if currency_rate is available
        if self.currency_rate and self.amount:
            self.amount_eur = self.amount * self.currency_rate

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.date} - {self.expense_type.name} - {self.amount} {self.currency.short_name}"


# class OrderRouteSegment(models.Model):
#     SEGMENT_TYPE_CHOICES = [
#         ('planned', 'Planned'),
#         ('actual', 'Actual'),
#     ]

#     order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='route_segments')
#     from_task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='segments_from')
#     to_task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='segments_to')
#     segment_type = models.CharField(max_length=10, choices=SEGMENT_TYPE_CHOICES)
#     segment_index = models.PositiveIntegerField()
#     distance_km = models.FloatField()
#     duration_min = models.FloatField(null=True, blank=True)
#     is_empty = models.BooleanField(default=False)
#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         constraints = [
#             models.CheckConstraint(
#                 check=models.Q(segment_type__in=['planned', 'actual']),
#                 name='segment_type_valid'
#             )
#         ]
#         ordering = ['order', 'segment_type', 'segment_index']
#         unique_together = ('order', 'segment_type', 'segment_index')

#     def __str__(self):
#         return f"{self.segment_type.title()} Segment {self.segment_index} of Order {self.order_id}"


class ExternalAPIKey(models.Model):
    key = models.CharField(max_length=64, unique=True, db_index=True, help_text="The API key (auto-generated)")
    name = models.CharField(max_length=255, help_text="Descriptive name for this API key")
    description = models.TextField(null=True, blank=True, help_text="Additional details about this API key and its usage")
    is_active = models.BooleanField(default=True, help_text="Whether this API key is currently active and can be used")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True, help_text="Optional expiration date for this API key")
    last_used_at = models.DateTimeField(null=True, blank=True, help_text="Last time this API key was used")
    usage_count = models.IntegerField(default=0, help_text="Number of times this API key has been used")
    rate_limit = models.IntegerField(default=100, help_text="Maximum number of requests per hour (0 = unlimited)")
    allowed_endpoints = models.JSONField(default=list, blank=True, null=True, help_text="List of endpoint patterns this key can access (empty = all endpoints)")
    ip_whitelist = models.JSONField(default=list, blank=True, null=True, help_text="List of IP addresses allowed to use this key (empty = any IP)")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_api_keys",
        help_text="User who created this API key",
    )

    class Meta:
        verbose_name = "External API Key"
        verbose_name_plural = "External API Keys"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def is_valid(self):
        """Return whether this key is active and has not expired."""
        return self.is_active and (
            self.expires_at is None or self.expires_at > timezone.now()
        )

    def can_access_endpoint(self, endpoint_path):
        """Allow every endpoint unless one or more path prefixes are configured."""
        if not self.allowed_endpoints:
            return True
        return any(endpoint_path.startswith(path) for path in self.allowed_endpoints)

    def can_access_from_ip(self, ip_address):
        """Allow every address unless an IP whitelist is configured."""
        if not self.ip_whitelist:
            return True
        return ip_address in self.ip_whitelist

    def check_rate_limit(self):
        """Rate-limit hook; zero and the current placeholder policy allow requests."""
        # There is no per-request timestamp store yet, so an hourly limit cannot
        # be calculated correctly from the cumulative usage_count field.
        return True

    def record_usage(self):
        """Update usage statistics after a request is authorized."""
        now = timezone.now()
        type(self).objects.filter(pk=self.pk).update(
            last_used_at=now,
            usage_count=models.F("usage_count") + 1,
        )
        self.last_used_at = now
        self.usage_count += 1


class ClientExternalIdentity(models.Model):
    PROVIDER_SOVTES = "sovtes"
    PROVIDER_CHOICES = [(PROVIDER_SOVTES, "Sovtes")]

    STATUS_PENDING = "pending"
    STATUS_LINKED = "linked"
    STATUS_CONFLICT = "conflict"
    STATUS_DISABLED = "disabled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_LINKED, "Linked"),
        (STATUS_CONFLICT, "Conflict"),
        (STATUS_DISABLED, "Disabled"),
    ]

    client = models.ForeignKey("base.Client", on_delete=models.CASCADE, related_name="external_identities")
    provider = models.CharField(max_length=32, choices=PROVIDER_CHOICES)
    external_client_id = models.CharField(max_length=255, null=True, blank=True)
    link_status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    link_key = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    linked_at = models.DateTimeField(null=True, blank=True)
    linked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="linked_external_client_identities",
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=("provider", "external_client_id"),
                condition=Q(external_client_id__isnull=False),
                name="uq_external_identity_provider_external_id",
            ),
            models.UniqueConstraint(
                fields=("client", "provider"),
                name="uq_external_identity_client_provider",
            ),
        ]

    def __str__(self):
        return f"{self.client} — {self.provider} ({self.link_status})"
