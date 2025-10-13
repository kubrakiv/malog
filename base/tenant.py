"""
Thread-local tenant management for multi-tenant isolation
"""
import threading
from typing import Optional
from django.core.exceptions import ImproperlyConfigured

# Thread-local storage for current client
_tenant_storage = threading.local()


def get_current_client():
    """
    Get the current client from thread-local storage
    """
    return getattr(_tenant_storage, 'client', None)


def set_current_client(client):
    """
    Set the current client in thread-local storage
    """
    _tenant_storage.client = client


def clear_current_client():
    """
    Clear the current client from thread-local storage
    """
    if hasattr(_tenant_storage, 'client'):
        delattr(_tenant_storage, 'client')


def require_client():
    """
    Get the current client or raise an exception if not set
    """
    client = get_current_client()
    if client is None:
        raise ImproperlyConfigured(
            "No client is set in the current context. "
            "Make sure the TenantMiddleware is installed and the user is authenticated."
        )
    return client


class TenantContext:
    """
    Context manager for temporarily setting a client
    """
    def __init__(self, client):
        self.client = client
        self.previous_client = None

    def __enter__(self):
        self.previous_client = get_current_client()
        set_current_client(self.client)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.previous_client:
            set_current_client(self.previous_client)
        else:
            clear_current_client()