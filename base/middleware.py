"""
Middleware for setting the current client based on authenticated user
"""
import logging
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from .tenant import set_current_client, clear_current_client

User = get_user_model()
logger = logging.getLogger(__name__)


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware that sets the current client based on the authenticated user's client.
    Handles both session auth and JWT auth.
    """

    def process_request(self, request):
        """
        Set the current client at the start of request processing.
        Handles both session auth and JWT auth.
        """
        clear_current_client()  # Clear any previous client

        # Try session auth first (standard Django auth)
        if request.user.is_authenticated and hasattr(request.user, 'client') and request.user.client:
            set_current_client(request.user.client)
            request.client = request.user.client
            logger.debug(f"Set client from session: {request.user.client}")
        else:
            # Try JWT auth: decode token from Authorization header
            client = self._get_client_from_jwt(request)
            if client:
                set_current_client(client)
                request.client = client
                logger.debug(f"Set client from JWT: {client}")
            else:
                request.client = None
                if request.path.startswith('/api/'):
                    logger.warning(f"No client context for API request: {request.path} {request.method}")

    def _get_client_from_jwt(self, request):
        """Extract client from JWT token in Authorization header"""
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header:
            logger.debug("No Authorization header in request")
            return None

        try:
            from rest_framework_simplejwt.authentication import JWTAuthentication
            auth = JWTAuthentication()
            result = auth.authenticate(request)
            if result:
                user, validated_token = result
                logger.debug(f"JWT decoded successfully for user: {user}")
                if hasattr(user, 'client'):
                    if user.client:
                        logger.debug(f"JWT user {user} has client: {user.client}")
                        return user.client
                    else:
                        logger.warning(f"JWT user {user} has no client assigned")
                else:
                    logger.warning(f"JWT user {user} has no 'client' field on User model")
            else:
                logger.debug("JWT auth returned None (no token in request)")
        except Exception as e:
            logger.warning(f"JWT authentication error: {type(e).__name__}: {str(e)}")
        return None

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