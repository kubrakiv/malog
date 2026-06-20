import logging
import os
from urllib.parse import unquote

from django.conf import settings

from . import messages
from .transport import send_message

logger = logging.getLogger(__name__)


def _deliver(message, notification_name):
    try:
        send_message(message)
        return True
    except Exception:
        logger.exception("Failed to send %s email", notification_name)
        return False


def send_registration_notifications(client, admin_user):
    admin_sent = _deliver(messages.registration_admin(client, admin_user), "registration admin")
    user_sent = _deliver(messages.registration_received(client, admin_user), "registration receipt")
    return admin_sent and user_sent


def send_account_approved(client, admin_user):
    return _deliver(messages.account_approved(client, admin_user), "account approval")


def send_account_rejected(client, admin_user, reason):
    return _deliver(
        messages.account_rejected(client, admin_user, reason), "account rejection"
    )


def send_sovtes_welcome(user, temporary_password, client):
    return _deliver(
        messages.sovtes_welcome(user, temporary_password, client), "Sovtes welcome"
    )


def send_trial_reminder(trial, admin_user, days_before):
    return _deliver(
        messages.trial_reminder(trial, admin_user, days_before), "trial reminder"
    )


def send_order_documents(document_paths, **message_data):
    message = messages.order_documents(**message_data)
    for document_path in document_paths:
        decoded_path = unquote(document_path)
        if decoded_path.startswith("/media/"):
            decoded_path = decoded_path[len("/media/"):]

        full_path = os.path.normpath(os.path.join(str(settings.MEDIA_ROOT), decoded_path))
        media_root = os.path.abspath(str(settings.MEDIA_ROOT))
        if os.path.commonpath([media_root, os.path.abspath(full_path)]) != media_root:
            logger.warning("Skipped email attachment outside MEDIA_ROOT: %s", document_path)
            continue
        if not os.path.exists(full_path):
            logger.warning("Email attachment does not exist: %s", full_path)
            continue

        with open(full_path, "rb") as attachment_file:
            message.add_attachment(
                attachment_file.read(),
                maintype="application",
                subtype="octet-stream",
                filename=os.path.basename(full_path),
            )

    send_message(message)
