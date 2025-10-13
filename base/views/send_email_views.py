from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from base.entry_data import email_sender, gmail_password

from urllib.parse import unquote

from email.message import EmailMessage
import ssl
import smtplib
import os

# EMAIL GENERATION FUNCTIONS
def generate_subject(customer, order_number, route, payment_type):
    if payment_type == "by copies":
        return f"{customer} - order {order_number} - route {route} - documents for payment"
    elif payment_type == "by originals":
        return f"Отправка документов на {customer} - заявка {order_number} - маршрут {route}"
    else:
        return "No Subject"


def generate_body(customer_manager, order_number, order_price, order_currency, invoice_number, invoice_date, cmr_number, payment_type, post_address):
    if payment_type == "by copies":
        return f"""
Dear {customer_manager}!

Please find in attachment all documents for payment.

Company: DELTA LOGISTICS SRO
Order: {order_number}
Total price: {order_price} {order_currency}
Invoice number: {invoice_number}
Invoice date: {invoice_date}

Best regards,
Ivan Kubrak
Managing Director
Delta Logistics S.R.O.
TIMOCOM ID: 460496
Cell.: +380 67 443 43 16
Mobile.: +380 50 418 64 84 (Viber, WhatsApp, Telegram)
Email: ivan.kubrak.eu@gmail.com
"""
    elif payment_type == "by originals":
        return f"""
Добрый день!

Прошу отправить по почте инвойс {invoice_number} от {invoice_date} на сумму {order_price} {order_currency}
и оригиналы транспортных документов (CMR, invoices и т.д.).

CMR: {cmr_number}

Адрес отправки:
{post_address}

Документы во вложении письма!

Best regards,
Ivan Kubrak
Managing Director
Delta Logistics S.R.O.
TIMOCOM ID: 460496
Cell.: +380 67 443 43 16
Mobile.: +380 50 418 64 84 (Viber, WhatsApp, Telegram)
Email: ivan.kubrak.eu@gmail.com
"""
    else:
        return "No Body Content"


# EMAIL VIEWS

@api_view(["POST"])
def send_email(request):
    try:
        data = request.data
        print("Received Data:", data)
        
        # Extracting data from request
        order_number = data.get("order_number")
        customer = data.get("customer")
        customer_manager = data.get("customer_manager")
        customer_email = data.get("customer_email")
        price = data.get("price")
        currency = data.get("currency")
        documents = data.get("documents", [])
        route = data.get("route")
        payment_type = data.get("payment_type")
        invoice_number = data.get("invoice_number")
        invoice_date = data.get("invoice_date")
        post_address = data.get("post_address")
        cmr_number = data.get("cmr_number")

        # Generate subject and body
        subject = generate_subject(customer, order_number, route, payment_type)
        body = generate_body(customer_manager, order_number, price, currency, invoice_number, invoice_date, cmr_number, payment_type, post_address)

        # Create email message
        email_message = create_email_message(subject, body, customer_email, documents)

        # Send email using SMTP with STARTTLS
        send_email_via_smtp(email_message)

        return Response({"message": "Email sent successfully"}, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return Response({"message": "Failed to send email", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def create_email_message(subject, body, email_receiver, documents):
    """
    Create an EmailMessage object with the provided subject, body, receiver, and attached documents.
    """
    email_message = EmailMessage()
    email_message['From'] = email_sender
    email_message['To'] = email_receiver
    email_message['Cc'] = "kurchenko.v@deltalogistics.cz"
    email_message['Subject'] = subject
    email_message.set_content(body)

    # Debug output for MEDIA_ROOT
    print("MEDIA_ROOT:", settings.MEDIA_ROOT)

    # Attach documents to the email
    for document_path in documents:
        attach_document(email_message, document_path)

    return email_message

def attach_document(email_message, document_path):
    """
    Attach a document to the given EmailMessage object if the file exists.
    """
    try:
        # Decode and normalize the document path
        decoded_path = unquote(document_path)
        print(f"Decoded document path: {decoded_path}")

        if decoded_path.startswith('/media/'):
            decoded_path = decoded_path[len('/media/'):]
            print(f"Trimmed decoded path (after removing '/media/'): {decoded_path}")

        # Construct the full path
        full_path = os.path.join(str(settings.MEDIA_ROOT), decoded_path)
        normalized_path = os.path.normpath(full_path)
        print(f"Attempting to attach: {normalized_path}")

        # Attach the file if it exists
        if os.path.exists(normalized_path):
            with open(normalized_path, "rb") as attachment_file:
                attachment_data = attachment_file.read()
                email_message.add_attachment(attachment_data, maintype="application", subtype="octet-stream", filename=os.path.basename(normalized_path))
                print(f"File attached: {normalized_path}")
        else:
            print(f"File does not exist: {normalized_path}")
    except Exception as e:
        print(f"Failed to attach document {document_path}: {str(e)}")

def send_email_via_smtp(email_message):
    """
    Send the given EmailMessage object using SMTP with STARTTLS.
    """
    context = ssl.create_default_context()
    with smtplib.SMTP('smtp.gmail.com', 587) as smtp:
        smtp.ehlo()  # Identify with the server
        smtp.starttls(context=context)  # Upgrade to secure connection
        smtp.ehlo()  # Re-identify after starting TLS
        smtp.login(email_sender, gmail_password)
        smtp.send_message(email_message)
        print("Email sent successfully")