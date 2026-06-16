from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("base", "0015_add_pricing_model_to_clientsubscription"),
    ]

    operations = [
        migrations.AddField(
            model_name="truck",
            name="sovtes_id",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="trailer",
            name="sovtes_id",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
