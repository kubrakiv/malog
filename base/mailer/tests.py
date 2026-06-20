from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, override_settings

from base.mailer import actions, messages, transport


class MailMessageTests(SimpleTestCase):
    @override_settings(
        DEFAULT_FROM_EMAIL="tms@sovtes.com",
        SYSTEM_ADMIN_EMAIL="admin@sovtes.com",
    )
    def test_registration_messages_use_central_addresses(self):
        client = SimpleNamespace(
            name="Example Logistics", slug="example-logistics", created_at="now"
        )
        user = SimpleNamespace(
            email="owner@example.com",
            get_full_name=lambda: "Example Owner",
        )

        admin_message = messages.registration_admin(client, user)
        user_message = messages.registration_received(client, user)

        self.assertEqual(admin_message["From"], "tms@sovtes.com")
        self.assertEqual(admin_message["To"], "admin@sovtes.com")
        self.assertEqual(user_message["To"], "owner@example.com")


class MailActionTests(SimpleTestCase):
    @patch("base.mailer.actions.send_message")
    def test_registration_action_sends_both_notifications(self, send_message):
        client = SimpleNamespace(name="Client", slug="client", created_at="now")
        user = SimpleNamespace(
            email="owner@example.com",
            get_full_name=lambda: "Owner",
        )

        self.assertTrue(actions.send_registration_notifications(client, user))
        self.assertEqual(send_message.call_count, 2)


class MailTransportTests(SimpleTestCase):
    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_FORCE_IPV4=True,
        EMAIL_HOST="smtp-relay.gmail.com",
        EMAIL_PORT=587,
        EMAIL_TIMEOUT=20,
        EMAIL_LOCAL_HOSTNAME="test-tms.sovtes.com",
        EMAIL_USE_TLS=True,
        EMAIL_HOST_USER="",
        EMAIL_HOST_PASSWORD="",
    )
    @patch("base.mailer.transport.IPv4SMTP")
    def test_ipv4_transport_uses_configured_relay_and_hostname(self, smtp_class):
        smtp = MagicMock()
        smtp_class.return_value.__enter__.return_value = smtp
        message = messages.text_message(
            "Subject", "Body", "recipient@example.com"
        )

        transport.send_message(message)

        smtp_class.assert_called_once_with(
            "smtp-relay.gmail.com",
            587,
            timeout=20,
            local_hostname="test-tms.sovtes.com",
        )
        smtp.starttls.assert_called_once()
        smtp.send_message.assert_called_once_with(message)
