from base.models import Customer, CustomerManager, Order, Task, Point, Currency, Country, PointCompany
from base.utils.task_utils import compute_task_title

def create_objects_from_parsed_data(parsed_data):
    """
    Creates necessary database objects from parsed data.
    """
    try:
        # Create or update Customer
        customer_data = parsed_data["customer_data"]
        customer, _ = Customer.objects.get_or_create(
            name=customer_data["name"],
            defaults={
                "nip_number": customer_data["nip_number"],
                "email": customer_data["email"],
            },
        )

        # Create or update Customer Manager
        manager_data = parsed_data["customer_manager_data"]
        manager, _ = CustomerManager.objects.get_or_create(
            full_name=manager_data["full_name"],
            defaults={
                "phone": manager_data["phone"],
                "email": manager_data["email"],
                "customer": customer,
            },
        )

        # Create Order
        order_data = parsed_data["order_data"]
        currency = Currency.objects.filter(short_name=order_data["currency"]).first()
        if not currency:
            currency = Currency.objects.get(short_name="EUR")  # Fallback

        order = Order.objects.create(
            order_number=order_data["order_number"],
            price=order_data["price"],
            customer=customer,
            customer_manager=manager,
            distance=order_data["distance"],
            cargo_name=order_data["cargo_name"],
            cargo_weight=order_data["cargo_weight"],
            payment_type_id=order_data["payment_type_id"],
            trailer_type=order_data["trailer_type"],
            vat=order_data["vat"],
            currency=currency,
            platform_id=7,  # Sovtes platform ID
            user_id=3,      # default user ID
        )

        # Create Points and Tasks
        for part in parsed_data["route_parts"]:
            point_data = part["point_data"]
            country = Country.objects.filter(short_name=point_data["country_short_name"]).first()
            if not country:
                raise ValueError(f"Country '{point_data['country_short_name']}' not found.")

            company, _ = PointCompany.objects.get_or_create(name=point_data["company_name"])

            point, _ = Point.objects.get_or_create(
                country=country,
                postal_code=point_data["postal_code"],
                city=point_data["city"],
                street=point_data["street"],
                gps_latitude=point_data["latitude"],
                gps_longitude=point_data["longitude"],
                customer=customer,
                company_name=company,
            )

            task_type = 1 if part["workaction"] == 1 else 2
            Task.objects.create(
                title=compute_task_title(point),
                point=point,
                start_date=part["date"],
                start_time=part["time"],
                order=order,
                type_id=task_type,
                external_id=part.get("id"),
            )

        return order
    except Exception as e:
        raise ValueError(f"Error creating objects: {e}")
