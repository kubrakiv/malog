import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0004_usersession'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserActivity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('method', models.CharField(max_length=10)),
                ('path', models.CharField(max_length=500)),
                ('action_label', models.CharField(blank=True, max_length=255)),
                ('status_code', models.PositiveSmallIntegerField()),
                ('timestamp', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('session', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='activities',
                    to='user.usersession',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='activities',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'User Activity',
                'verbose_name_plural': 'User Activities',
                'ordering': ['-timestamp'],
            },
        ),
    ]
