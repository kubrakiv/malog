from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Client,
    Task,
    TaskStatus,
    Truck,
    Trailer,
    Customer,
    Order,
    TaskType,
    CustomerManager,
    Point,
    PointCompany,
    Country,
    FileType,
    OrderFile,
    Platform,
    PaymentType,
    DriverAssignment,
    Currency,
    CompanyBank,
    Company,
    Invoice,
    OrderStatusHistory,
    FuelPrice,
)
from user.models import (
    DriverProfile
)
from user.serializers import UserSerializer, DriverProfileSerializer
import os
import unicodedata


class ClientSerializer(serializers.ModelSerializer):
    """
    Serializer for Client model
    """
    class Meta:
        model = Client
        fields = ['id', 'name', 'slug', 'is_active', 'created_at', 'updated_at', 'settings']
        read_only_fields = ['created_at', 'updated_at']


class CompanyBankSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyBank
        fields = "__all__"


class CompanySerializer(serializers.ModelSerializer):
    bank = CompanyBankSerializer(source="bank.name", many=False, read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)

    class Meta:
        model = Company
        fields = "__all__"
        read_only_fields = ['client', 'created_at', 'updated_at']


class FuelPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelPrice
        fields = "__all__"


class TrailerSerializer(serializers.ModelSerializer):
    truck = serializers.SerializerMethodField()

    class Meta:
        model = Trailer
        fields = ["id", "plates", "brand", "entry_date", "end_date", "price", "entry_mileage", "vin_code", "year", "truck"]

    def get_truck(self, obj):
        truck = obj.trucks.first()
        return truck.plates if truck else None
    

class TruckSerializer(serializers.ModelSerializer):
    trailer = serializers.CharField(
        source="trailer.plates", required=False, allow_null=True
    )
    # driver = serializers.CharField()
    driver_details = DriverProfileSerializer(source="driver", many=False, read_only=True)
    trailer_details = TrailerSerializer(source="trailer", many=False, read_only=True)
    class Meta:
        model = Truck
        fields = [
            "id",
            "plates",
            "brand",
            "model",
            "vin_code",
            "year",
            "entry_date",
            "end_date",
            "entry_mileage",
            "price",
            "gps_id",
            "trailer",
            "driver",
            "diesel_norm",
            "tire_cost_per_km",
            "adblue_norm",
            "driver_details",
            "trailer_details",
        ]

    
class DriverAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverAssignment
        fields = "__all__"


class PaymentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentType
        fields = "__all__"


class PlatformSerializer(serializers.ModelSerializer):
    class Meta:
        model = Platform
        fields = "__all__"


class PointCompaniesSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointCompany
        fields = "__all__"


class CountriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = "__all__"


class FileTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileType
        fields = "__all__"


class OrderFileSerializer(serializers.ModelSerializer):
    file_type = serializers.CharField(source="file_type.name", required=False, allow_null=True)
    order = serializers.CharField(source="order.number", required=False, allow_null=True)
    order_id = serializers.CharField(source="order.id", required=False, allow_null=True)
    file_name = serializers.SerializerMethodField()  # Add a SerializerMethodField for the modified file name

    class Meta:
        model = OrderFile
        fields = ["id", "file", "file_type", "uploaded_at", "order", "order_id", "file_name"]  # Include the new field

    def get_file_name(self, obj):
        # Extract the filename from the file path
        file_path = obj.file.name
        file_name = os.path.basename(file_path)
        return file_name
        # Normalize the file name to remove non-ASCII characters and special symbols
        # normalized_file_name = unicodedata.normalize('NFKD', file_name).encode('ascii', 'ignore').decode('utf-8')
        # return normalized_file_name


class PointSerializer(serializers.ModelSerializer):
    country = serializers.CharField(
        source="country.name", required=False, allow_null=True
    )
    country_short = serializers.CharField(
        source="country.short_name", required=False, allow_null=True
    )
    company_name = serializers.CharField(
        source="company_name.name", required=False, allow_null=True
    )
    customer = serializers.CharField(
        source="customer.name", required=False, allow_null=True
    )

    class Meta:
        model = Point
        fields = [
            "id",
            "postal_code",
            "country",
            "country_short",
            "city",
            "street",
            "street_number",
            "gps_latitude",
            "gps_longitude",
            "company_name",
            "customer",
            "created_at",
        ]

    def update(self, instance, validated_data):
        print("Validated Data:")
        print(validated_data)
        customer_data = validated_data.pop("customer", None)
        country_data = validated_data.pop("country", None)
        company_data = validated_data.pop("company_name", None)
        print("Company Data:")
        print(company_data)

        instance.postal_code = validated_data.get("postal_code", instance.postal_code)
        instance.city = validated_data.get("city", instance.city)
        instance.street = validated_data.get("street", instance.street)
        instance.street_number = validated_data.get(
            "street_number", instance.street_number
        )
        instance.gps_latitude = validated_data.get(
            "gps_latitude", instance.gps_latitude
        )
        instance.gps_longitude = validated_data.get(
            "gps_longitude", instance.gps_longitude
        )

        if customer_data:
            customer_instance, _ = Customer.objects.get_or_create(
                name=customer_data["name"]
            )
            instance.customer = customer_instance

        if country_data:
            country_instance, _ = Country.objects.get_or_create(
                name=country_data["name"]
            )
            instance.country = country_instance

        if company_data:
            company_instance, _ = PointCompany.objects.get_or_create(
                name=company_data["name"]
            )
            instance.company_name = company_instance

        instance.save()
        return instance


class CustomerManagerSerializer(serializers.ModelSerializer):
    customer = serializers.CharField(
        source="customer.name", required=False, allow_null=True
    )

    class Meta:
        model = CustomerManager
        fields = ["id", "full_name", "position", "phone", "email", "created_at", "customer"]


class CustomerSerializer(serializers.ModelSerializer):
    managers = CustomerManagerSerializer(many=True, read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "nip_number",
            "vat_number",
            "email",
            "website",
            "post_address",
            "created_at",
            "managers",
        ]


class TaskTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskType
        fields = "__all__"


class TaskSerializer(serializers.ModelSerializer):
    truck = serializers.CharField(
        source="truck.plates", required=False, allow_null=True
    )
    driver = serializers.CharField(source="driver.full_name", required=False, allow_null=True)
    type = serializers.CharField(source="type.name", required=False, allow_null=True)
    order = serializers.CharField(
        source="order.number", allow_null=True, required=False
    )
    order_number = serializers.CharField(source="order.order_number", allow_null=True, required=False)
    customer = serializers.CharField(source="order.customer.name", allow_null=True, required=False)
    order_id = serializers.CharField(source="order.id", allow_null=True, required=False)
    point_details = PointSerializer(source="point", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "start_date",
            "start_time",
            "end_date",
            "end_time",
            "external_id",
            "driver",
            "truck",
            "type",
            "order",
            "order_number",
            "customer",
            "order_id",
            "point_details",
        ]

    def create(self, validated_data):
        print("Validated Data:", validated_data)

        # Extracting nested data for foreign key relationships
        driver_data = validated_data.pop("driver", None)
        truck_data = validated_data.pop("truck", None)
        type_data = validated_data.pop("type", None)
        order_data = validated_data.pop("order", None)
        status_data = validated_data.pop("status", None)
        point_data = validated_data.pop("point", None)

        # Creating or getting instances for foreign keys
        driver_instance = (
            DriverProfile.objects.get_or_create(full_name=driver_data["full_name"])[0]
            if driver_data
            else None
        )
        truck_instance = (
            Truck.objects.get_or_create(plates=truck_data["plates"])[0]
            if truck_data
            else None
        )
        type_instance = (
            TaskType.objects.get_or_create(name=type_data["name"])[0]
            if type_data
            else None
        )
        order_instance = (
            Order.objects.get(number=order_data["number"])[0] if order_data else None
        )
        status_instance = (
            TaskStatus.objects.get(name=status_data["name"])[0] if status_data else None
        )
        point_instance = Point.objects.get(id=point_data["id"]) if point_data else None

        # Creating the Task instance
        task = Task.objects.create(
            **validated_data,
            driver=driver_instance,
            truck=truck_instance,
            type=type_instance,
            order=order_instance,
            status=status_instance,
            point=point_instance,
        )

        return task

    def update(self, instance, validated_data):
        driver_data = validated_data.pop("driver", None)
        truck_data = validated_data.pop("truck", None)
        order_data = validated_data.pop("order", None)
        type_data = validated_data.pop("type", None)

        instance.title = validated_data.get("title", instance.title)
        instance.start_date = validated_data.get("start_date", instance.start_date)
        instance.start_time = validated_data.get("start_time", instance.start_time)
        instance.end_date = validated_data.get("end_date", instance.end_date)
        instance.end_time = validated_data.get("end_time", instance.end_time)

        if driver_data:
            driver_instance, _ = DriverProfile.objects.get_or_create(
                full_name=driver_data["full_name"]
            )
            instance.driver = driver_instance

        if truck_data:
            truck_instance, _ = Truck.objects.get_or_create(plates=truck_data["plates"])
            instance.truck = truck_instance

        if type_data:
            type_instance, _ = TaskType.objects.get_or_create(name=type_data["name"])
            instance.type = type_instance

        if order_data:
            try:
                order_instance = Order.objects.get(number=order_data)
                instance.order = order_instance
            except Order.DoesNotExist:
                # Handle the case where the order with the specified number does not exist
                pass

        instance.save()
        return instance
    

class InvoiceSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(
        source="order.order_number", required=False, allow_null=True
    )
    order_id = serializers.CharField(
        source="order.id", required=False, allow_null=True
    )
    customer = serializers.CharField(
        source="order.customer.name", required=False, allow_null=True
    )

    currency = serializers.CharField(
        source="currency.short_name", required=False, allow_null=True
    )

    company = serializers.CharField(
        source="company.name", required=False, allow_null=True
    )

    user = serializers.CharField(
        source="user.username", required=False, allow_null=True
    )
    
    class Meta:
        model = Invoice
        fields = [
            'id',
            'user',
            'created_at',
            'number',
            'service_name',
            'truck',
            'trailer',
            'loading_date',
            'unloading_date',
            'order_number',
            'company',
            'order_number',
            'order_id',
            'price',
            'vat',
            'total_price',
            'currency',
            'currency_rate',
            'customer',
            'invoicing_date',
            'vat_date',
            'due_date',
            'send_date',
            'accepted_date',
            'payment_date',
        ]
        read_only_fields = ['id', 'number', 'created_at']


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    status = serializers.CharField(source="status.name", required=False, allow_null=True)
    class Meta:
        model = OrderStatusHistory
        fields = ['status', 'started_at', 'ended_at', 'is_active']


class OrderSerializer(serializers.ModelSerializer):
    # vat = serializers.CharField(allow_blank=True, required=False)
    vat = serializers.BooleanField()  # Ensure it accepts boolean values
    customer = serializers.CharField(
        source="customer.name", required=False, allow_null=True
    )
    platform = serializers.CharField(
        source="platform.name", required=False, allow_null=True
    )
    payment_type = serializers.CharField(
        source="payment_type.name", required=False, allow_null=True
    )
    currency = serializers.CharField(
        source="currency.short_name", required=False, allow_null=True
    )
    truck = serializers.CharField(
        source="truck.plates", required=False, allow_null=True
    )
    driver = serializers.CharField(
        source="driver.full_name", required=False, allow_null=True
    )
    customer_manager = serializers.CharField(
        source="customer_manager.full_name", required=False, allow_null=True
    )
    

    loading_address = serializers.SerializerMethodField()
    unloading_address = serializers.SerializerMethodField()
    loading_start_date = serializers.SerializerMethodField()
    loading_end_date = serializers.SerializerMethodField()
    loading_start_time = serializers.SerializerMethodField()
    loading_end_time = serializers.SerializerMethodField()
    unloading_start_date = serializers.SerializerMethodField()
    unloading_end_date = serializers.SerializerMethodField()
    unloading_start_time = serializers.SerializerMethodField()
    unloading_end_time = serializers.SerializerMethodField()
    current_status = serializers.SerializerMethodField()
    # payment_type = serializers.SerializerMethodField()
    truck_info = TruckSerializer(source="truck", many=False, read_only=True)
    driver_info = DriverProfileSerializer(source="driver", many=False, read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    user = UserSerializer(many=False, read_only=True)
    manager = CustomerManagerSerializer(many=False, read_only=True)
    invoice = InvoiceSerializer(many=False, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "number",
            "order_number",
            "platform",
            "price",
            "currency",
            "vat",
            "market_price",
            "payment_type",
            "payment_period",
            "invoice",
            "route",
            "empty_distance",
            "distance",
            "tolls",
            "cargo_name",
            "cargo_weight",
            "loading_type",
            "trailer_type",
            "customer",
            "manager",
            "customer_manager",
            "truck",
            "driver",
            "truck_info",
            "driver_info",
            "loading_address",
            "unloading_address",
            "loading_start_date",
            "loading_end_date",
            "loading_start_time",
            "loading_end_time",
            "unloading_start_date",
            "unloading_end_date",
            "unloading_start_time",
            "unloading_end_time",
            "tasks",
            "current_status",
            "status_history",
            "notice",
            "created_at",
        ]

    def get_current_status(self, obj):
        # Filter for the active status
        status = obj.status_history.filter(is_active=True).first()
        # OR get the latest status
        # status = obj.status_history.order_by('-started_at').first()
        
        if status:
            return OrderStatusHistorySerializer(status).data
        return None

    def get_loading_address(self, obj):
        task = obj.tasks.filter(type__name="Loading").first()

        if task and task.title:
            loading_address = task.title
            return loading_address
        # else:
        #     loading_address = f"{task.point_details.country_short}-{task.point_details.postal_code}"
        return None

    def get_unloading_address(self, obj):
        task = obj.tasks.filter(type__name="Unloading").first()

        if task and task.title:
            unloading_address = task.title
            return unloading_address
        return None

    def get_loading_start_date(self, obj):
        task = obj.tasks.filter(type__name="Loading").first()

        if task and task.start_date:
            loading_start_date = task.start_date
            return loading_start_date
        return None
    
    def get_loading_end_date(self, obj):
        task = obj.tasks.filter(type__name="Loading").first()

        if task and task.end_date:
            loading_end_date = task.end_date
            return loading_end_date
        return None

    def get_loading_start_time(self, obj):
        task = obj.tasks.filter(type__name="Loading").first()

        if task and task.start_time:
            loading_start_time = task.start_time
            return loading_start_time
        return None

    def get_loading_end_time(self, obj):
        task = obj.tasks.filter(type__name="Loading").first()

        if task and task.end_time:
            loading_end_time = task.end_time
            return loading_end_time
        return None

    def get_unloading_start_date(self, obj):
        task = obj.tasks.filter(type__name="Unloading").last()

        if task and task.start_date:
            unloading_start_date = task.start_date
            return unloading_start_date
        return None

    def get_unloading_end_date(self, obj):
        task = obj.tasks.filter(type__name="Unloading").last()

        if task and task.end_date:
            unloading_end_date = task.end_date
            return unloading_end_date
        return None

    def get_unloading_start_time(self, obj):
        task = obj.tasks.filter(type__name="Unloading").last()

        if task and task.start_time:
            unloading_start_time = task.start_time
            return unloading_start_time
        return None
    
    def get_unloading_end_time(self, obj):
        task = obj.tasks.filter(type__name="Unloading").last()

        if task and task.end_time:
            unloading_end_time = task.end_time
            return unloading_end_time
        return None

    def update(self, instance, validated_data):
        driver_data = validated_data.pop("driver", None)
        truck_data = validated_data.pop("truck", None)
        customer_data = validated_data.pop("customer", None)
        customer_manager_data = validated_data.pop("customer_manager", None)
        platform_data = validated_data.pop("platform", None)
        payment_type_data = validated_data.pop("payment_type", None)
        currency_data = validated_data.pop("currency", None)

        instance.vat = validated_data.get("vat", instance.vat)
        instance.order_number = validated_data.get(
            "order_number", instance.order_number
        )
        instance.price = validated_data.get("price", instance.price)
        instance.market_price = validated_data.get("market_price", instance.market_price)
        instance.payment_period = validated_data.get(
            "payment_period", instance.payment_period
        )

        instance.empty_distance = validated_data.get(
            "empty_distance", instance.empty_distance
        )
        instance.distance = validated_data.get("distance", instance.distance)
        instance.tolls = validated_data.get("tolls", instance.tolls)
        instance.cargo_weight = validated_data.get(
            "cargo_weight", instance.cargo_weight
        )
        instance.cargo_name = validated_data.get("cargo_name", instance.cargo_name)
        instance.loading_type = validated_data.get(
            "loading_type", instance.loading_type
        )
        instance.trailer_type = validated_data.get(
            "trailer_type", instance.trailer_type
        )
        instance.notice = validated_data.get("notice", instance.notice)
        instance.route = validated_data.get("route", instance.route)

        if driver_data:
            driver_instance, _ = DriverProfile.objects.get_or_create(
                full_name=driver_data["full_name"]
            )
            instance.driver = driver_instance

        if truck_data is not None:
            try:
                truck_instance, _ = Truck.objects.get_or_create(
                    plates=truck_data["plates"]
                )
                if truck_instance is not None:
                    instance.truck = truck_instance
            except Exception as e:
                # Handle the exception, log it, or return an error response
                print(f"Error updating truck: {e}")

        if customer_data:
            customer_instance, _ = Customer.objects.get_or_create(
                name=customer_data["name"]
            )
            instance.customer = customer_instance

        if customer_manager_data:
            customer_manager_instance, _ = CustomerManager.objects.get_or_create(
                full_name=customer_manager_data["full_name"]
            )
            instance.customer_manager = customer_manager_instance
        
        if platform_data:
            platform_instance, _ = Platform.objects.get_or_create(
                name=platform_data["name"]
            )
            instance.platform = platform_instance
        
        if payment_type_data:
            payment_type_instance, _ = PaymentType.objects.get_or_create(
                name=payment_type_data["name"]
            )
            instance.payment_type = payment_type_instance

        if currency_data:
            currency_instance, _ = Currency.objects.get_or_create(
                short_name=currency_data["short_name"]
            )
            instance.currency = currency_instance

        instance.save()
        return instance



class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = "__all__"
