from base.models import (
    Customer, CustomerManager, Order, Task, TaskType,
    Point, Currency, Country, PointCompany, Platform, Truck, DriverProfile,
)
from base.utils.task_utils import compute_task_title
from base.utils.route_category_utils import assign_route_category


SOVTES_WORKACTION_TASK_TYPES = {
    1: ("Loading", "Завантаження"),
    2: ("Unloading", "Розвантаження"),
    3: ("Customs", "Митниця"),
    4: ("Border Crossing", "Прикордонний перехід"),
}


def _fit_char(value, max_len):
    """Return a string that fits a DB CharField(max_length=max_len)."""
    if value is None:
        return ""
    text = str(value)
    return text[:max_len]


def _find_driver_by_sovtes_id(client, driver_sovtes_id):
    """Find local DriverProfile by Sovtes ID with a normalized comparison."""
    if not client or driver_sovtes_id in (None, ""):
        return None

    target = str(driver_sovtes_id).strip()
    # Fast path: exact DB match
    driver = DriverProfile.objects.filter(
        sovtes_id=target,
        profile__client=client,
    ).first()
    if driver:
        return driver

    # Fallback: compare normalized strings in case of stored whitespace/noise
    for candidate in DriverProfile.objects.filter(
        profile__client=client,
        sovtes_id__isnull=False,
    ).exclude(sovtes_id=""):
        if str(candidate.sovtes_id).strip() == target:
            return candidate

    return None


def _get_task_type_for_sovtes_workaction(workaction):
    task_type_name, task_type_name_uk = SOVTES_WORKACTION_TASK_TYPES.get(
        workaction,
        ("Extra Task", "Додаткове завдання"),
    )
    task_type, _ = TaskType.objects.get_or_create(
        name=task_type_name,
        defaults={"name_uk": task_type_name_uk},
    )
    return task_type


def create_objects_from_parsed_data(
    parsed_data,
    user=None,
    truck_plates=None,
    driver_name=None,
    driver_sovtes_id=None,
):
    try:
        # Customer
        customer_data = parsed_data["customer_data"]
        customer, _ = Customer.objects.get_or_create(
            name=customer_data["name"] or "Unknown",
            defaults={
                "nip_number": customer_data["nip_number"],
                "email": customer_data["email"],
            },
        )

        # Customer Manager
        manager_data = parsed_data["customer_manager_data"]
        manager, _ = CustomerManager.objects.get_or_create(
            full_name=manager_data["full_name"] or "Unknown",
            defaults={
                "phone": manager_data["phone"],
                "email": manager_data["email"],
                "customer": customer,
            },
        )

        # Currency — create on first use if table is empty
        order_data = parsed_data["order_data"]
        currency_code = (order_data.get("currency") or "UAH").upper()
        currency, _ = Currency.objects.get_or_create(
            short_name=currency_code,
            defaults={"name": currency_code},
        )

        # Platform — create "Sovtes" entry if not present yet
        platform, _ = Platform.objects.get_or_create(
            name="Sovtes",
            defaults={"name": "Sovtes"},
        )

        # Truck / Driver — look up by plates / name within the user's tenant
        client = user.client if user else None
        truck = None
        driver = None
        if truck_plates and client:
            truck = Truck.objects.filter(plates=truck_plates, client=client).first()
        if driver_sovtes_id and client:
            driver = _find_driver_by_sovtes_id(client, driver_sovtes_id)
        if not driver and driver_name and client:
            driver = DriverProfile.objects.filter(full_name=driver_name, profile__client=client).first()

        order = Order.objects.create(
            order_number=_fit_char(order_data["order_number"], 20),
            tender_parent=_fit_char(order_data.get("tender_parent"), 20),
            price=order_data["price"] or 0,
            customer=customer,
            customer_manager=manager,
            distance=order_data["distance"] or 0,
            cargo_name=_fit_char(order_data["cargo_name"], 50),
            cargo_weight=_fit_char(order_data["cargo_weight"], 50),
            # payment_type_id from Sovtes is their internal ID, not our DB FK
            payment_type=None,
            trailer_type=_fit_char(order_data["trailer_type"], 50),
            vat=order_data["vat"] or False,
            currency=currency,
            platform=platform,
            user=user,
            truck=truck,
            driver=driver,
        )

        # Points and Tasks
        for part in parsed_data["route_parts"]:
            point_data = part["point_data"]

            # Country — create on first use if table is empty
            country_code = (point_data.get("country_short_name") or "").upper()
            if country_code:
                country, _ = Country.objects.get_or_create(
                    short_name=country_code,
                    defaults={"name": country_code.upper()},
                )
            else:
                country = None

            company_name = point_data.get("company_name") or "Unknown"
            company, _ = PointCompany.objects.get_or_create(name=company_name)

            point, _ = Point.objects.get_or_create(
                country=country,
                postal_code=point_data.get("postal_code") or "",
                city=point_data.get("city") or "",
                street=point_data.get("street") or "",
                street_number="",
                gps_latitude=point_data.get("latitude") or "0.0",
                gps_longitude=point_data.get("longitude") or "0.0",
                customer=customer,
                company_name=company,
            )

            task_type = _get_task_type_for_sovtes_workaction(part.get("workaction"))
            Task.objects.create(
                title=compute_task_title(point),
                point=point,
                start_date=part["date"],
                start_time=part["time"],
                order=order,
                type=task_type,
                external_id=part.get("id"),
                truck=truck,
                driver=driver,
            )

        assign_route_category(order)

        return order
    except Exception as e:
        raise ValueError(f"Error creating objects: {e}")
