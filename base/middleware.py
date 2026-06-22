"""
Middleware for setting the current client based on authenticated user,
and for tracking user activity per session.
"""
import re
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


# ---------------------------------------------------------------------------
# Action label resolution
# ---------------------------------------------------------------------------

_ACTION_PATTERNS = [
    # Замовлення
    ('POST',   r'^/api/orders/$',                          'Створив замовлення'),
    ('PUT',    r'^/api/orders/\d+/',                       'Оновив замовлення'),
    ('PATCH',  r'^/api/orders/\d+/',                       'Оновив замовлення'),
    ('DELETE', r'^/api/orders/\d+/',                       'Видалив замовлення'),
    ('GET',    r'^/api/orders/$',                          'Переглянув список замовлень'),
    ('GET',    r'^/api/orders/\d+/',                       'Переглянув замовлення'),
    # Тягачі
    ('POST',   r'^/api/trucks/$',                          'Додав тягач'),
    ('PUT',    r'^/api/trucks/\d+/',                       'Оновив тягач'),
    ('PATCH',  r'^/api/trucks/\d+/',                       'Оновив тягач'),
    ('DELETE', r'^/api/trucks/\d+/',                       'Видалив тягач'),
    # Причепи
    ('POST',   r'^/api/trailers/$',                        'Додав причіп'),
    ('PUT',    r'^/api/trailers/\d+/',                     'Оновив причіп'),
    ('PATCH',  r'^/api/trailers/\d+/',                     'Оновив причіп'),
    ('DELETE', r'^/api/trailers/\d+/',                     'Видалив причіп'),
    # Водії
    ('POST',   r'^/api/driver-profiles/$',                 'Додав водія'),
    ('PUT',    r'^/api/driver-profiles/\d+/',              'Оновив водія'),
    ('PATCH',  r'^/api/driver-profiles/\d+/',              'Оновив водія'),
    ('DELETE', r'^/api/driver-profiles/\d+/',              'Видалив водія'),
    # Клієнти
    ('POST',   r'^/api/customers/$',                       'Додав клієнта'),
    ('PUT',    r'^/api/customers/\d+/',                    'Оновив клієнта'),
    ('PATCH',  r'^/api/customers/\d+/',                    'Оновив клієнта'),
    ('DELETE', r'^/api/customers/\d+/',                    'Видалив клієнта'),
    # Менеджери клієнтів
    ('POST',   r'^/api/customer-managers/$',               'Додав менеджера клієнта'),
    ('PUT',    r'^/api/customer-managers/\d+/',            'Оновив менеджера клієнта'),
    ('DELETE', r'^/api/customer-managers/\d+/',            'Видалив менеджера клієнта'),
    # Рахунки
    ('POST',   r'^/api/invoices/$',                        'Створив рахунок'),
    ('PUT',    r'^/api/invoices/\d+/',                     'Оновив рахунок'),
    ('PATCH',  r'^/api/invoices/\d+/',                     'Оновив рахунок'),
    ('DELETE', r'^/api/invoices/\d+/',                     'Видалив рахунок'),
    # Завдання
    ('POST',   r'^/api/tasks/$',                           'Додав завдання'),
    ('PUT',    r'^/api/tasks/\d+/',                        'Оновив завдання'),
    ('PATCH',  r'^/api/tasks/\d+/',                        'Оновив завдання'),
    ('DELETE', r'^/api/tasks/\d+/',                        'Видалив завдання'),
    # Точки маршруту
    ('POST',   r'^/api/points/$',                          'Додав точку'),
    ('PUT',    r'^/api/points/\d+/',                       'Оновив точку'),
    ('DELETE', r'^/api/points/\d+/',                       'Видалив точку'),
    # Документи
    ('POST',   r'^/api/documents/',                        'Завантажив документ'),
    ('DELETE', r'^/api/documents/',                        'Видалив документ'),
    # Email
    ('POST',   r'^/api/send-email/',                       'Надіслав документи email'),
    # Sovtes — синхронізація
    ('POST',   r'^/api/sovtes/fleet/sync-truck',           'Синхронізував тягач з Sovtes'),
    ('POST',   r'^/api/sovtes/fleet/sync-trailer',         'Синхронізував причіп з Sovtes'),
    ('POST',   r'^/api/sovtes/fleet/sync-driver',          'Синхронізував водія з Sovtes'),
    ('POST',   r'^/api/sovtes/fleet/link-truck',           "Прив'язав тягач до Sovtes"),
    ('POST',   r'^/api/sovtes/fleet/link-trailer',         "Прив'язав причіп до Sovtes"),
    ('POST',   r'^/api/sovtes/fleet/link-driver',          "Прив'язав водія до Sovtes"),
    ('POST',   r'^/api/sovtes/fleet/resync-all-trucks',    'Оновив всі тягачі з Sovtes'),
    ('POST',   r'^/api/sovtes/fleet/resync-all-trailers',  'Оновив всі причепи з Sovtes'),
    ('POST',   r'^/api/sovtes/fleet/resync-all-drivers',   'Оновив всіх водіїв з Sovtes'),
    # Маршрут / імпорт
    ('POST',   r'^/api/import/',                           'Імпортував маршрут'),
    # Призначення тягача та водія
    ('POST',   r'^/api/assign-truck-driver/',              'Призначив тягач та водія'),
    # Компанія
    ('PUT',    r'^/api/company/',                          'Оновив дані компанії'),
    ('PATCH',  r'^/api/company/',                          'Оновив дані компанії'),
    # Підписки
    ('POST',   r'^/api/subscriptions/',                    'Змінив підписку'),
    # Адмін — клієнти
    ('POST',   r'^/api/admin/approve-client/',             'Підтвердив реєстрацію клієнта'),
    ('POST',   r'^/api/admin/reject-client/',              'Відхилив реєстрацію клієнта'),
    # Користувачі
    ('POST',   r'^/api/users/register/',                   'Створив користувача'),
    ('PUT',    r'^/api/users/update/',                     'Оновив користувача'),
    ('DELETE', r'^/api/users/delete/',                     'Видалив користувача'),
    ('POST',   r'^/api/users/\w+/reset-password/',         'Скинув пароль'),
    ('PUT',    r'^/api/users/profile/update/',             'Оновив власний профіль'),
]

_COMPILED_PATTERNS = [
    (method, re.compile(pattern), label)
    for method, pattern, label in _ACTION_PATTERNS
]


def _resolve_label(method, path):
    for meth, pattern, label in _COMPILED_PATTERNS:
        if method == meth and pattern.match(path):
            return label
    return ''


# ---------------------------------------------------------------------------
# UserActivityMiddleware
# ---------------------------------------------------------------------------

_SKIP_PATHS = frozenset(['/api/users/login/', '/api/users/logout/'])
_SKIP_METHODS = frozenset(['OPTIONS', 'HEAD'])

_activity_logger = logging.getLogger(__name__)


class UserActivityMiddleware(MiddlewareMixin):
    """
    Records every authenticated API request to UserActivity, linked to the
    current UserSession identified by the X-Session-Id request header.
    """

    def process_request(self, request):
        request._activity_user = None
        request._activity_session_id = request.META.get('HTTP_X_SESSION_ID')

        if not self._should_log(request):
            return

        if hasattr(request, 'user') and request.user.is_authenticated:
            request._activity_user = request.user
        else:
            request._activity_user = self._user_from_jwt(request)

    def _should_log(self, request):
        return (
            request.path.startswith('/api/')
            and request.method not in _SKIP_METHODS
            and request.path not in _SKIP_PATHS
        )

    def _user_from_jwt(self, request):
        if not request.META.get('HTTP_AUTHORIZATION', '').startswith('Bearer '):
            return None
        try:
            from rest_framework_simplejwt.authentication import JWTAuthentication
            result = JWTAuthentication().authenticate(request)
            return result[0] if result else None
        except Exception:
            return None

    def process_response(self, request, response):
        user = getattr(request, '_activity_user', None)
        if user is None:
            return response

        try:
            from user.models import UserActivity, UserSession
            session_id = getattr(request, '_activity_session_id', None)
            session = None
            if session_id:
                session = UserSession.objects.filter(session_id=session_id).first()
            UserActivity.objects.create(
                session=session,
                user=user,
                method=request.method,
                path=request.path[:500],
                action_label=_resolve_label(request.method, request.path),
                status_code=response.status_code,
            )
        except Exception:
            _activity_logger.exception('Failed to log user activity')

        return response