from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings # it's access to variables in settings.py file
from django.conf.urls.static import static # it's a specific function that connects urls
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),

    # Schema endpoint
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    
    # Swagger UI
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Redoc UI
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    path("api/csrf-token/", include("base.urls.csrf_token_urls")),
    path("api/orders/", include("base.urls.order_urls")),
    path("api/order-statuses/", include("base.urls.order_statuses_urls")),
    path("api/tasks/", include("base.urls.task_urls")),
    path("api/points/", include("base.urls.point_urls")),
    path("api/trucks/", include("base.urls.truck_urls")),
    path("api/trailers/", include("base.urls.trailer_urls")),
    path("api/customers/", include("base.urls.customer_urls")),
    path("api/customer-managers/", include("base.urls.customer_manager_urls")),
    path("api/point-companies/", include("base.urls.point_company_urls")),
    path("api/countries/", include("base.urls.country_urls")),
    path("api/documents/", include("base.urls.upload_documents_urls")),
    path("api/file-types/", include("base.urls.file_types_urls")),
    path("api/platforms/", include("base.urls.platform_urls")),
    path("api/payment-types/", include("base.urls.payment_types_urls")),
    path("api/task-types/", include("base.urls.task_types_urls")),
    path("api/send-email/", include("base.urls.send_email_urls")),
    path("api/company/", include("base.urls.company_urls")),
    path("api/currencies/", include("base.urls.currency_urls")),
    path("api/invoices/", include("base.urls.invoice_urls")),
    path("api/fm-track-proxy/", include("base.urls.fm_truck_proxy_urls")),
    path("api/import/", include("base.urls.import_route_urls")),
    path("api/assign-truck-driver/", include("base.urls.assign_truck_and_driver_urls")),
    path("api/sovtes/", include("base.urls.sovtes_tenders_urls")),
    path("api/sovtes-auth/", include("base.urls.sovtes_auth_urls")),
    path("api/admin/sovtes/", include("base.urls.sovtes_user_management_urls")),
    path("api/subscriptions/", include("base.urls.subscription_urls")),
    path("api/onboarding/", include("base.urls.onboarding_urls")),

    path("api/ruptela/", include("base.urls.ruptela_urls")),
    path("api/youscore/", include("base.urls.youscore_urls")),

    path("api/roles/", include("user.urls.role_urls")),
    path("api/users/", include("user.urls.user_urls")),
    path("api/driver-profiles/", include("user.urls.driver_profile_urls")),
    path("api/admin/", include("user.urls.admin_urls")),
    
    # Route calculator
    path("api/route_calculator/", include("route_calculator.urls")),
]

# Development-only patterns
if settings.DEBUG:
    # Add debug toolbar if installed
    try:
        import debug_toolbar
        urlpatterns += [
            path("__debug__/", include("debug_toolbar.urls")),
        ]
    except ImportError:
        pass
    
    # Serve media files in development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += staticfiles_urlpatterns()

# Production/Staging: serve React app for all non-API routes
if not settings.DEBUG:
    urlpatterns += [
        re_path(r'^(?!api/|admin/|static/|media/).*$', TemplateView.as_view(template_name="index.html")),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
