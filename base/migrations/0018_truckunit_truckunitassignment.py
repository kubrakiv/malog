from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0017_alter_client_is_active_externalapikey"),
    ]

    operations = [
        migrations.CreateModel(
            name="TruckUnit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
                (
                    "client",
                    models.ForeignKey(
                        help_text="Client that owns this record",
                        on_delete=django.db.models.deletion.CASCADE,
                        to="base.client",
                    ),
                ),
            ],
            options={
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="TruckUnitAssignment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("start_date", models.DateTimeField(default=django.utils.timezone.now)),
                ("end_date", models.DateTimeField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "client",
                    models.ForeignKey(
                        help_text="Client that owns this record",
                        on_delete=django.db.models.deletion.CASCADE,
                        to="base.client",
                    ),
                ),
                (
                    "truck",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="unit_assignments",
                        to="base.truck",
                    ),
                ),
                (
                    "unit",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="truck_assignments",
                        to="base.truckunit",
                    ),
                ),
            ],
            options={
                "ordering": ["-start_date"],
            },
        ),
    ]
