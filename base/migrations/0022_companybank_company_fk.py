from django.db import migrations, models
import django.db.models.deletion


def populate_company_fk(apps, schema_editor):
    """Link existing CompanyBank records to their Company via the old Company.bank FK."""
    Company = apps.get_model('base', 'Company')
    for company in Company.objects.filter(bank__isnull=False).select_related('bank'):
        company.bank.company = company
        company.bank.save(update_fields=['company'])


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0021_add_soft_delete_to_truck_trailer'),
    ]

    operations = [
        migrations.AddField(
            model_name='companybank',
            name='company',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='banks',
                to='base.company',
            ),
        ),
        migrations.RunPython(populate_company_fk, migrations.RunPython.noop),
    ]
