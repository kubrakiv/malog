from django.db import migrations, models


def _copy_fk_to_m2m(apps, schema_editor):
    # After the new M2M through table is created, restore data from the backup.
    with schema_editor.connection.cursor() as cur:
        cur.execute(
            "INSERT INTO base_truck_logist (truck_id, logistprofile_id) "
            "SELECT truck_id, logist_id FROM _logist_bk"
        )


def _restore_fk_from_m2m(apps, schema_editor):
    # Reverse: nothing to do — the FK column is re-added empty by the reversal of
    # RemoveField, and populating a single FK from a many-to-many is ambiguous.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("base", "0022_companybank_company_fk"),
        ("user", "0002_profile_registration_password"),
    ]

    operations = [
        # 1. Snapshot existing FK data before the column is dropped.
        migrations.RunSQL(
            sql=(
                "CREATE TABLE _logist_bk AS "
                "SELECT id AS truck_id, logist_id "
                "FROM base_truck WHERE logist_id IS NOT NULL"
            ),
            reverse_sql="DROP TABLE IF EXISTS _logist_bk",
        ),
        # 2. Remove the old ForeignKey column.
        migrations.RemoveField(model_name="truck", name="logist"),
        # 3. Add the ManyToManyField (creates base_truck_logist through table).
        migrations.AddField(
            model_name="truck",
            name="logist",
            field=models.ManyToManyField(
                blank=True,
                related_name="trucks",
                to="user.logistprofile",
            ),
        ),
        # 4. Re-populate the through table from the snapshot.
        migrations.RunPython(_copy_fk_to_m2m, _restore_fk_from_m2m),
        # 5. Drop the temporary snapshot table.
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS _logist_bk",
            reverse_sql="",
        ),
    ]
