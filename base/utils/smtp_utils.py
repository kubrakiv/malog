import socket
import smtplib


class IPv4SMTP(smtplib.SMTP):
    """SMTP client that resolves and connects over IPv4 while preserving TLS SNI."""

    def _get_socket(self, host, port, timeout):
        if timeout is not None and not timeout:
            raise ValueError("Non-blocking socket (timeout=0) is not supported")

        last_error = None
        for family, socktype, proto, _, address in socket.getaddrinfo(
            host,
            port,
            socket.AF_INET,
            socket.SOCK_STREAM,
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
