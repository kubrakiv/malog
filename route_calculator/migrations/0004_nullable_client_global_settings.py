from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0002_initial"),
        ("route_calculator", "0003_truckparameters_fixed_cost_breakdown"),
    ]

    operations = [
        migrations.AlterField(
            model_name="fuelprices",
            name="client",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="base.client",
                help_text="Client that owns this record (optional for global settings)",
            ),
        ),
        migrations.AlterField(
            model_name="truckparameters",
            name="client",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="base.client",
                help_text="Client that owns this record (optional for global settings)",
            ),
        ),
    ]
