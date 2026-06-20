from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from base.models import ExternalAPIKey


class ExternalAPIKeyTests(TestCase):
    def setUp(self):
        self.api_key = ExternalAPIKey.objects.create(
            key="a" * 64,
            name="YouScore test key",
        )

    def test_validity_checks_active_and_expiration(self):
        self.assertTrue(self.api_key.is_valid())

        self.api_key.expires_at = timezone.now() - timedelta(seconds=1)
        self.assertFalse(self.api_key.is_valid())

        self.api_key.expires_at = None
        self.api_key.is_active = False
        self.assertFalse(self.api_key.is_valid())

    def test_endpoint_and_ip_restrictions(self):
        self.assertTrue(self.api_key.can_access_endpoint("/api/youscore/vehicles/owned"))
        self.assertTrue(self.api_key.can_access_from_ip("192.0.2.10"))

        self.api_key.allowed_endpoints = ["/api/youscore/"]
        self.api_key.ip_whitelist = ["192.0.2.10"]
        self.assertTrue(self.api_key.can_access_endpoint("/api/youscore/vehicles/owned"))
        self.assertFalse(self.api_key.can_access_endpoint("/api/private/"))
        self.assertTrue(self.api_key.can_access_from_ip("192.0.2.10"))
        self.assertFalse(self.api_key.can_access_from_ip("192.0.2.11"))

    def test_record_usage_is_persisted(self):
        self.api_key.record_usage()

        self.api_key.refresh_from_db()
        self.assertEqual(self.api_key.usage_count, 1)
        self.assertIsNotNone(self.api_key.last_used_at)
