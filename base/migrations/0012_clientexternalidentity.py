from django.conf import settings
from django.db import migrations, models
from django.db.models import Q
import django.db.models.deletion
import django.utils.timezone
import uuid


def backfill_sovtes_mappings(apps, schema_editor):
    Client = apps.get_model('base', 'Client')
    ClientExternalIdentity = apps.get_model('base', 'ClientExternalIdentity')

    for client in Client.objects.filter(slug__startswith='sovtes-').iterator():
        external_client_id = client.slug.replace('sovtes-', '', 1)
        if not external_client_id:
            continue

        mapping, _ = ClientExternalIdentity.objects.get_or_create(
            client=client,
            provider='sovtes',
            defaults={
                'external_client_id': external_client_id,
                'link_status': 'linked',
                'linked_at': django.utils.timezone.now(),
                'metadata': {'backfilled_from_slug': True},
            },
        )

        updated = False
        if mapping.external_client_id != external_client_id:
            mapping.external_client_id = external_client_id
            updated = True
        if mapping.link_status != 'linked':
            mapping.link_status = 'linked'
            updated = True
        if not mapping.linked_at:
            mapping.linked_at = django.utils.timezone.now()
            updated = True

        if updated:
            mapping.save(update_fields=['external_client_id', 'link_status', 'linked_at', 'updated_at'])


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0011_alter_externalapikey_allowed_endpoints_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ClientExternalIdentity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('provider', models.CharField(choices=[('sovtes', 'Sovtes')], max_length=32)),
                ('external_client_id', models.CharField(blank=True, max_length=255, null=True)),
                ('link_status', models.CharField(choices=[('pending', 'Pending'), ('linked', 'Linked'), ('conflict', 'Conflict'), ('disabled', 'Disabled')], default='pending', max_length=16)),
                ('link_key', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('linked_at', models.DateTimeField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('client', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='external_identities', to='base.client')),
                ('linked_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='linked_external_client_identities', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
                'constraints': [
                    models.UniqueConstraint(condition=Q(external_client_id__isnull=False), fields=('provider', 'external_client_id'), name='uq_external_identity_provider_external_id'),
                    models.UniqueConstraint(fields=('client', 'provider'), name='uq_external_identity_client_provider'),
                ],
            },
        ),
        migrations.RunPython(backfill_sovtes_mappings, migrations.RunPython.noop),
    ]
