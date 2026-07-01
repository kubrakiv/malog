from datetime import date, datetime, time

from base.models import RouteCategory


ROUTE_CATEGORY_BY_DIRECTION = {
    ("EU", "UA"): {
        "ukr": "\u0406\u043c\u043f\u043e\u0440\u0442",
        "eng": "Import",
    },
    ("UA", "EU"): {
        "ukr": "\u0415\u043a\u0441\u043f\u043e\u0440\u0442",
        "eng": "Export",
    },
    ("EU", "EU"): {
        "ukr": "\u041f\u0435\u0440\u0435\u0432\u0435\u0437\u0435\u043d\u043d\u044f \u043f\u043e \u0404\u0432\u0440\u043e\u043f\u0456",
        "eng": "European Transport",
    },
    ("UA", "UA"): {
        "ukr": "\u041f\u0435\u0440\u0435\u0432\u0435\u0437\u0435\u043d\u043d\u044f \u043f\u043e \u0423\u043a\u0440\u0430\u0457\u043d\u0456",
        "eng": "Ukraine Transport",
    },
}


def _task_sort_key(task):
    start_date = task.start_date
    start_time = task.start_time

    if isinstance(start_date, str) and start_date:
        start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
    if isinstance(start_time, str) and start_time:
        start_time = datetime.strptime(start_time, "%H:%M:%S").time()

    return (
        start_date or date.max,
        start_time or time.min,
        task.id or 0,
    )


def _country_bucket(task):
    country_short = (
        getattr(getattr(task.point, "country", None), "short_name", "") or ""
    ).strip().upper()

    if not country_short:
        return None

    return "UA" if country_short == "UA" else "EU"


def _find_category(client, category_names):
    if not client or not category_names:
        return None

    base_qs = RouteCategory.all_objects.filter(
        client=client,
        is_active=True,
    ).order_by("id")

    category = base_qs.filter(ukr__iexact=category_names["ukr"]).first()
    if category:
        return category

    return base_qs.filter(eng__iexact=category_names["eng"]).first()


def infer_route_category(order):
    tasks = list(
        order.tasks.select_related("type", "point__country").filter(
            type__name__in=["Loading", "Unloading"]
        )
    )
    loading_tasks = sorted(
        (task for task in tasks if task.type and task.type.name == "Loading"),
        key=_task_sort_key,
    )
    unloading_tasks = sorted(
        (task for task in tasks if task.type and task.type.name == "Unloading"),
        key=_task_sort_key,
    )

    if not loading_tasks or not unloading_tasks:
        return None

    start_bucket = _country_bucket(loading_tasks[0])
    finish_bucket = _country_bucket(unloading_tasks[-1])
    category_names = ROUTE_CATEGORY_BY_DIRECTION.get((start_bucket, finish_bucket))

    return _find_category(order.client, category_names)


def assign_route_category(order, save=True):
    category = infer_route_category(order)
    if not category:
        return None

    if order.category_id != category.id:
        order.category = category
        if save:
            order.save(update_fields=["category", "updated_at"])

    return category
