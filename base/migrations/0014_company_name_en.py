from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0013_update_unlimited_plan_features'),
    ]

    operations = [
        migrations.AddField(
            model_name='company',
            name='name_en',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='company',
            name='legal_address',
            field=models.CharField(blank=True, max_length=250, null=True),
        ),
    ]
