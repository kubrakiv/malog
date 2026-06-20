import logging

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from base.mailer import send_order_documents

logger = logging.getLogger(__name__)


def _sender_details(user):
    role_profile = getattr(user, "adminprofile", None) or getattr(
        user, "logistprofile", None
    )
    return {
        "sender_company": user.client.name,
        "sender_name": user.get_full_name() or user.username,
        "sender_position": getattr(role_profile, "position", "") or "",
        "sender_phone": user.phone_number
        or getattr(role_profile, "phone_number", "")
        or "",
        "sender_email": user.email or settings.DEFAULT_FROM_EMAIL,
    }


@api_view(["POST"])
def send_email(request):
    data = request.data
    try:
        if not request.user.is_authenticated or not request.user.client:
            raise ValueError("Email sender must belong to a system client")

        send_order_documents(
            document_paths=data.get("documents", []),
            customer=data.get("customer"),
            customer_manager=data.get("customer_manager"),
            recipient=data.get("customer_email"),
            order_number=data.get("order_number"),
            route=data.get("route"),
            payment_type=data.get("payment_type"),
            price=data.get("price"),
            currency=data.get("currency"),
            invoice_number=data.get("invoice_number"),
            invoice_date=data.get("invoice_date"),
            cmr_number=data.get("cmr_number"),
            post_address=data.get("post_address"),
            **_sender_details(request.user),
        )
        return Response({"message": "Email sent successfully"}, status=status.HTTP_200_OK)
    except Exception as exc:
        logger.exception("Failed to send order documents")
        return Response(
            {"message": "Failed to send email", "error": str(exc)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
