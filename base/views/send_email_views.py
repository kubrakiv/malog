import logging

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from base.mailer import send_order_documents

logger = logging.getLogger(__name__)


@api_view(["POST"])
def send_email(request):
    data = request.data
    try:
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
        )
        return Response({"message": "Email sent successfully"}, status=status.HTTP_200_OK)
    except Exception as exc:
        logger.exception("Failed to send order documents")
        return Response(
            {"message": "Failed to send email", "error": str(exc)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
