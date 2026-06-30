from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("route_calculator", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="truckparameters",
            name="admin_cost_per_km",
            field=models.DecimalField(
                decimal_places=4,
                default=0,
                help_text="Administrative costs per kilometer in EUR",
                max_digits=8,
                verbose_name="Admin Cost per km",
            ),
        ),
        migrations.AddField(
            model_name="truckparameters",
            name="leasing_cost_per_km",
            field=models.DecimalField(
                decimal_places=4,
                default=0,
                help_text="Leasing/depreciation costs per kilometer in EUR",
                max_digits=8,
                verbose_name="Leasing Cost per km",
            ),
        ),
        migrations.AddField(
            model_name="truckparameters",
            name="insurance_cost_per_km",
            field=models.DecimalField(
                decimal_places=4,
                default=0,
                help_text="Insurance costs per kilometer in EUR",
                max_digits=8,
                verbose_name="Insurance Cost per km",
            ),
        ),
        migrations.AlterField(
            model_name="truckparameters",
            name="fixed_cost_per_km",
            field=models.DecimalField(
                decimal_places=4,
                help_text="Total fixed costs per kilometer in EUR (sum of admin + leasing + insurance)",
                max_digits=8,
                verbose_name="Fixed Cost per km",
            ),
        ),
    ]
