"""
Tenant-aware managers and querysets for automatic client filtering
"""
from django.db import models
from .tenant import get_current_client


class TenantQuerySet(models.QuerySet):
    """
    QuerySet that automatically filters by current client
    """
    def filter_by_client(self, client=None):
        """
        Filter queryset by client
        """
        if client is None:
            client = get_current_client()
        
        if client is None:
            return self.none()
            
        return self.filter(client=client)


class TenantManager(models.Manager):
    """
    Manager that automatically filters by current client
    """
    def get_queryset(self):
        """
        Return queryset filtered by current client
        """
        client = get_current_client()
        if client is None:
            # During migrations, tests, or admin operations, we might not have a client
            return super().get_queryset()
        
        return super().get_queryset().filter(client=client)

    def all_clients(self):
        """
        Return all objects regardless of client (for admin/superuser operations)
        """
        return super().get_queryset()

    def for_client(self, client):
        """
        Return objects for a specific client
        """
        return super().get_queryset().filter(client=client)


class GlobalManager(models.Manager):
    """
    Manager that doesn't filter by client (for global models like Client itself)
    """
    pass


class TenantRelatedManager(models.Manager):
    """
    Manager for models that have a client through a foreign key relationship
    """
    def __init__(self, client_field_path='client'):
        super().__init__()
        self.client_field_path = client_field_path

    def get_queryset(self):
        """
        Return queryset filtered by current client through relationship
        """
        client = get_current_client()
        if client is None:
            return super().get_queryset()
        
        filter_kwargs = {self.client_field_path: client}
        return super().get_queryset().filter(**filter_kwargs)

    def all_clients(self):
        """
        Return all objects regardless of client
        """
        return super().get_queryset()

    def for_client(self, client):
        """
        Return objects for a specific client
        """
        filter_kwargs = {self.client_field_path: client}
        return super().get_queryset().filter(**filter_kwargs)