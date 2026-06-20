from email.message import EmailMessage

from django.conf import settings
from django.utils import timezone


def text_message(subject, body, recipient, cc=None):
    message = EmailMessage()
    message["From"] = settings.DEFAULT_FROM_EMAIL
    message["To"] = recipient
    if cc:
        message["Cc"] = cc
    message["Subject"] = subject
    message.set_content(body)
    return message


def registration_admin(client, admin_user):
    subject = f"New Client Registration: {client.name}"
    body = f"""
A new client has registered and needs approval:

Company: {client.name}
Slug: {client.slug}
Admin User: {admin_user.get_full_name()} ({admin_user.email})
Registration Date: {client.created_at}

Please review and approve/reject this registration in the admin panel.

Best regards,
TMS SOVTES
    """
    return text_message(subject, body, settings.SYSTEM_ADMIN_EMAIL)


def registration_received(client, admin_user):
    body = f"""
Dear {admin_user.get_full_name()},

Thank you for registering with TMS SOVTES. Your registration for {client.name} has been received and is currently pending approval.

You will receive another email once your account has been reviewed and approved by our team.

Best regards,
The TMS SOVTES Team
    """
    return text_message(
        "Registration Received - Pending Approval", body, admin_user.email
    )


def account_approved(client, admin_user):
    body = f"""
Dear {admin_user.get_full_name()},

Great news! Your TMS SOVTES account for {client.name} has been approved and is now active.

You can now log in at: {settings.FRONTEND_URL}/login

Username: {admin_user.username}

Welcome to TMS SOVTES!

Best regards,
The TMS SOVTES Team
    """
    return text_message(
        "Welcome to TMS SOVTES - Account Approved!", body, admin_user.email
    )


def account_rejected(client, admin_user, reason):
    body = f"""
Dear {admin_user.get_full_name()},

We regret to inform you that your TMS SOVTES registration for {client.name} has not been approved at this time.

Reason: {reason}

If you have any questions or would like to reapply, please contact us at support@sovtes.com.ua.

Best regards,
The TMS SOVTES Team
    """
    return text_message("TMS SOVTES Registration Update", body, admin_user.email)


def sovtes_welcome(user, temporary_password, client):
    subject = f"Welcome to TMS SOVTES - Login Credentials for {client.name}"
    body = f"""
Dear {user.get_full_name() or user.first_name},

Welcome to TMS SOVTES! Your account has been successfully created for {client.name}.

Your login credentials:
Username: {user.username}
Email: {user.email}
Temporary Password: {temporary_password}

Login URL: {settings.FRONTEND_URL}/login

IMPORTANT SECURITY NOTES:
This password is for emergency access only.
You should primarily authenticate via your Sovtes JWT token.
Please keep these credentials secure and do not share them.

Best regards,
The TMS SOVTES Team

This email was sent automatically from TMS SOVTES.
Account created: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')} UTC
Client: {client.name}
    """
    return text_message(subject, body, user.email)


def trial_reminder(trial, admin_user, days_before):
    subject = f"Your TMS SOVTES trial ends in {days_before} days"
    truck_limit = (
        trial.plan.truck_limit if trial.plan.truck_limit != -1 else "Unlimited"
    )
    body = f"""
Hello {admin_user.get_full_name()},

Your TMS SOVTES trial ends in {days_before} days.

Company: {trial.client.name}
Plan: {trial.plan.display_name}
End date: {trial.trial_end_date.strftime('%d.%m.%Y')}
Truck limit: {truck_limit}

Please renew your plan before the trial ends to keep uninterrupted access.

Best regards,
The TMS SOVTES Team
    """
    return text_message(subject, body, admin_user.email)


def order_documents(
    customer,
    customer_manager,
    recipient,
    order_number,
    route,
    payment_type,
    price,
    currency,
    invoice_number,
    invoice_date,
    cmr_number,
    post_address,
):
    if payment_type == "by copies":
        subject = f"{customer} - order {order_number} - route {route} - documents for payment"
        body = f"""
Dear {customer_manager}!

Please find in attachment all documents for payment.

Company: DELTA LOGISTICS SRO
Order: {order_number}
Total price: {price} {currency}
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
        subject = f"Sending documents to {customer} - order {order_number} - route {route}"
        body = f"""
Hello!

Please send invoice {invoice_number} dated {invoice_date} for {price} {currency},
along with the original transport documents (CMR, invoices, etc.).

CMR: {cmr_number}

Postal address:
{post_address}

The documents are attached to this email.

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
        raise ValueError(f"Unsupported payment type: {payment_type}")

    return text_message(subject, body, recipient, cc=settings.ORDER_EMAIL_CC)
