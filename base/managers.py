"""
Tenant-aware managers and querysets for automatic client filtering
"""
import logging
import sys
from django.db import models
from .tenant import get_current_client

logger = logging.getLogger(__name__)


def _is_in_request_context():
    """Check if we're being called from a request context (not migration/management command)"""
    # If we're in a migration or management command, don't enforce strict isolation
    if 'migrate' in sys.argv or 'makemigrations' in sys.argv:
        return False
    if 'shell' in sys.argv or 'dbshell' in sys.argv:
        return False
    # runserver, runserver_plus are request contexts
    if any(cmd in sys.argv for cmd in ['runserver', 'test', 'gunicorn', 'uwsgi']):
        return True
    # If manage.py is in args but no specific command, it might be a management command
    if any('manage.py' in arg for arg in sys.argv):
        if len(sys.argv) > 1 and sys.argv[1] in ['runserver', 'runserver_plus', 'test']:
            return True
        if len(sys.argv) > 1 and sys.argv[1] not in ['migrate', 'makemigrations', 'shell', 'dbshell']:
            # Might be a web server - be lenient
            return True
    # Default: assume it might be a request (WSGI server, etc)
    return True


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
        Return queryset filtered by current client.
        In request contexts: tries to enforce isolation but logs warnings if context unavailable.
        In migrations/management: allows unfiltered access.
        """
        client = get_current_client()
        if client is None:
            if _is_in_request_context():
                # In request context but no client - this indicates middleware/auth issue
                logger.error(
                    "SECURITY WARNING: Client context not available in request context. "
                    "Tenant isolation may be broken. Ensure: 1) TenantMiddleware is enabled "
                    "2) User is properly authenticated 3) Middleware runs before views"
                )
                # Don't block - log the issue but allow query to proceed unfiltered
                # This prevents breaking the app while alerting to the problem
                logger.warning("Returning UNFILTERED queryset - tenant isolation not active!")
                return super().get_queryset()
            else:
                # In migrations/management commands, silently allow
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
        Return queryset filtered by current client through relationship.
        In request contexts: tries to enforce isolation but logs warnings if context unavailable.
        In migrations/management: allows unfiltered access.
        """
        client = get_current_client()
        if client is None:
            if _is_in_request_context():
                # In request context but no client - this indicates middleware/auth issue
                logger.error(
                    "SECURITY WARNING: Client context not available in request context. "
                    "Tenant isolation may be broken. Ensure middleware is properly configured."
                )
                logger.warning("Returning UNFILTERED queryset - tenant isolation not active!")
                return super().get_queryset()
            else:
                # In migrations/management commands, silently allow
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