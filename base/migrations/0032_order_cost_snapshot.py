from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0031_costcenter_truck_unit'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderstatus',
            name='is_terminal',
            field=models.BooleanField(
                default=False,
                help_text='When an order reaches a terminal status, its costs are frozen as a snapshot.',
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='cost_snapshot',
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='cost_snapshot_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
