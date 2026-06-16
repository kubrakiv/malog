from django.db import migrations


UNLIMITED_FEATURES = [
    "Fleet Management",
    "Driver Management",
    "Route Planner",
    "Orders Management",
    "Route Calculator",
    "Points Management",
    "Invoicing",
    "Customer Management",
    "Tasks Management",
    "Live Map",
    "Dashboard",
    "System Administration",
    "Employee Management",
    "External Platforms",
]


def update_unlimited_features(apps, schema_editor):
    SubscriptionPlan = apps.get_model("base", "SubscriptionPlan")
    try:
        plan = SubscriptionPlan.objects.get(name="unlimited")
        plan.features = UNLIMITED_FEATURES
        plan.save()
    except SubscriptionPlan.DoesNotExist:
        pass


def revert_unlimited_features(apps, schema_editor):
    SubscriptionPlan = apps.get_model("base", "SubscriptionPlan")
    try:
        plan = SubscriptionPlan.objects.get(name="unlimited")
        plan.features = [f for f in plan.features if f not in ("Employee Management", "External Platforms")]
        plan.save()
    except SubscriptionPlan.DoesNotExist:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0012_clientexternalidentity"),
    ]

    operations = [
        migrations.RunPython(update_unlimited_features, revert_unlimited_features),
    ]
