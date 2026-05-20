from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='registration_password',
            field=models.CharField(
                blank=True,
                help_text='Stores the password provided during the latest registration or password reset flow',
                max_length=255,
                null=True,
            ),
        ),
    ]