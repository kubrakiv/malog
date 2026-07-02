from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("user", "0005_useractivity"),
        ("base", "0035_increase_order_price_precision"),
    ]

    operations = [
        migrations.CreateModel(
            name="TruckLogistOrder",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("order_index", models.PositiveIntegerField(default=0)),
                (
                    "client",
                    models.ForeignKey(
                        help_text="Client that owns this record",
                        on_delete=django.db.models.deletion.CASCADE,
                        to="base.client",
                    ),
                ),
                (
                    "logist",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="truck_orders",
                        to="user.logistprofile",
                    ),
                ),
                (
                    "truck",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="logist_orders",
                        to="base.truck",
                    ),
                ),
            ],
            options={
                "ordering": ["order_index", "truck_id"],
                "unique_together": {("truck", "logist")},
            },
        ),
    ]
