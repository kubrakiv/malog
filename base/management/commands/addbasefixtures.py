from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        call_command("makemigrations")
        call_command("migrate")
        call_command("loaddata", "db_country_fixture.json")
        call_command("loaddata", "db_point_company_fixture.json")
        call_command("loaddata", "db_truck_fixture.json")
        call_command("loaddata", "db_driver_fixture.json")
        call_command("loaddata", "db_payment_type_fixture.json")
        call_command("loaddata", "db_customer_fixture.json")
        call_command("loaddata", "db_customer_manager_fixture.json")
        call_command("loaddata", "db_order_fixture.json")
        call_command("loaddata", "db_task_type_fixture.json")
        call_command("loaddata", "db_task_status_fixture.json")
        call_command("loaddata", "db_point_fixture.json")
        call_command("loaddata", "db_task_fixture.json")
        call_command("loaddata", "db_task_status_change_fixture.json")
