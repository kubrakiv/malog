from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("base", "0025_add_customer_legal_address"),
    ]

    operations = [
        migrations.CreateModel(
            name="SovtesWebhookEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("event_type", models.CharField(db_index=True, max_length=100)),
                ("periodic", models.CharField(blank=True, db_index=True, max_length=100)),
                ("route_id", models.IntegerField(blank=True, db_index=True, null=True)),
                ("payload", models.JSONField()),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                "ordering": ["id"],
            },
        ),
    ]
