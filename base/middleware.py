"""
Middleware for setting the current client based on authenticated user
"""
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from .tenant import set_current_client, clear_current_client

User = get_user_model()


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware that sets the current client based on the authenticated user's client
    """
    
    def process_request(self, request):
        """
        Set the current client at the start of request processing
        """
        clear_current_client()  # Clear any previous client
        
        if request.user.is_authenticated and hasattr(request.user, 'client') and request.user.client:
            set_current_client(request.user.client)
            # Store client on request for easy access in views
            request.client = request.user.client
        else:
            request.client = None

    def process_response(self, request, response):
        """
        Clear the current client after request processing
        """
        clear_current_client()
        return response

    def process_exception(self, request, exception):
        """
        Clear the current client if an exception occurs
        """
        clear_current_client()
        return None