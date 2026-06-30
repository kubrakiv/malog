import json
import os

from django.core.management.base import BaseCommand

from base.models import (
    Country, Currency,
    FileType, OrderStatus, PaymentType, Platform, TaskStatus, TaskType,
)

FIXTURES_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "fixtures", "order_management_lists"
)

# (fixture_file, ModelClass, lookup_field, extra_default_fields)
GLOBAL_FIXTURES = [
    ("countries.json",      Country,     "name", ["short_name"]),
    ("currencies.json",     Currency,    "name", ["short_name"]),
    ("payment_types.json",  PaymentType, "name", []),
    ("file_types.json",     FileType,    "name", []),
    ("task_types.json",     TaskType,    "name", ["name_uk"]),
    ("task_statuses.json",  TaskStatus,  "name", []),
    ("order_statuses.json", OrderStatus, "name", ["description"]),
    ("platforms.json",      Platform,    "name", []),
]


def _load_fixture(fixture_file, model_class, lookup_field, extra_defaults, style, stdout):
    path = os.path.join(FIXTURES_DIR, fixture_file)
    if not os.path.exists(path):
        stdout.write(style.WARNING(f"  Fixture not found, skipping: {fixture_file}"))
        return

    with open(path, encoding="utf-8-sig") as f:
        data = json.load(f)

    created_count = 0
    updated_count = 0
    for item in data:
        fields = item.get("fields", {})
        lookup = {lookup_field: fields[lookup_field]}
        defaults = {k: fields[k] for k in extra_defaults if k in fields}
        obj, created = model_class.objects.get_or_create(**lookup, defaults=defaults)
        if created:
            created_count += 1
        elif defaults:
            # Update extra fields on existing records (e.g. name_uk added later)
            changed = {k: v for k, v in defaults.items() if getattr(obj, k) != v}
            if changed:
                for k, v in changed.items():
                    setattr(obj, k, v)
                obj.save(update_fields=list(changed.keys()))
                updated_count += 1

    total = len(data)
    existing = total - created_count - updated_count
    stdout.write(
        f"  {model_class.__name__}: "
        f"{created_count} created, {updated_count} updated, {existing} already up-to-date"
    )


class Command(BaseCommand):
    help = "Seed the database with base reference data (countries, currencies, platforms, etc.)"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING("Loading global reference data..."))
        for args_ in GLOBAL_FIXTURES:
            _load_fixture(*args_, style=self.style, stdout=self.stdout)

        self.stdout.write(self.style.SUCCESS("Done."))
