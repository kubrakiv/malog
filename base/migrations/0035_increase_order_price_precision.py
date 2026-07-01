from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0034_order_tender_parent"),
    ]

    operations = [
        migrations.AlterField(
            model_name="order",
            name="price",
            field=models.DecimalField(
                "Order price", blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.AlterField(
            model_name="order",
            name="market_price",
            field=models.DecimalField(
                "Market price", blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
    ]
