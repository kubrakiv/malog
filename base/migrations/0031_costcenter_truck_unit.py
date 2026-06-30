from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0030_cost_center'),
    ]

    operations = [
        migrations.AddField(
            model_name='costcenter',
            name='truck_unit',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='cost_centers',
                to='base.truckunit',
                verbose_name='Підрозділ',
            ),
        ),
        migrations.AlterModelOptions(
            name='costcenter',
            options={'ordering': ['truck_unit__name', 'name'], 'verbose_name': 'Cost Center', 'verbose_name_plural': 'Cost Centers'},
        ),
    ]
