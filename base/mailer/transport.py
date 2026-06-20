import logging
import socket
import smtplib
import ssl

from django.conf import settings

logger = logging.getLogger(__name__)


class IPv4SMTP(smtplib.SMTP):
    """SMTP client that preserves the hostname for TLS but connects over IPv4."""

    def _get_socket(self, host, port, timeout):
        if timeout is not None and not timeout:
            raise ValueError("Non-blocking socket (timeout=0) is not supported")

        last_error = None
        for family, socktype, proto, _, address in socket.getaddrinfo(
            host, port, socket.AF_INET, socket.SOCK_STREAM
        ):
            sock = None
            try:
                sock = socket.socket(family, socktype, proto)
                sock.settimeout(timeout)
                if self.source_address:
                    sock.bind(self.source_address)
                sock.connect(address)
                return sock
            except OSError as exc:
                last_error = exc
                if sock is not None:
                    sock.close()

        if last_error is not None:
            raise last_error
        raise OSError(f"No IPv4 address found for SMTP host {host}")


def send_message(message):
    """Deliver one stdlib EmailMessage using the active environment settings."""
    if settings.EMAIL_BACKEND.endswith("console.EmailBackend"):
        print(message.as_string())
        return

    smtp_class = IPv4SMTP if settings.EMAIL_FORCE_IPV4 else smtplib.SMTP
    with smtp_class(
        settings.EMAIL_HOST,
        settings.EMAIL_PORT,
        timeout=settings.EMAIL_TIMEOUT,
        local_hostname=settings.EMAIL_LOCAL_HOSTNAME,
    ) as smtp:
        smtp.ehlo()
        if settings.EMAIL_USE_TLS:
            smtp.starttls(context=ssl.create_default_context())
            smtp.ehlo()
        if settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD:
            smtp.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        smtp.send_message(message)

    logger.info(
        "Email sent: subject=%r recipients=%s",
        message.get("Subject"),
        message.get_all("To", []),
    )
