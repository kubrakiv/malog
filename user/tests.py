from django.test import TestCase
from django.urls import reverse
from django.test.client import RequestFactory
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from base.models import Client, ClientExternalIdentity
from base.subscription_models import ClientSubscription, SubscriptionPlan, SubscriptionPlanChangeRequest
from base.sovtes_auth import SovtesUserManager
from django.contrib import admin
from user.models import Profile, Role
from user.admin import ProfileAdmin


class ProfileRegistrationPasswordTests(TestCase):
	def test_create_user_accepts_registration_password(self):
		user = Profile.objects.create_user(
			username='registration-user',
			email='registration@example.com',
			password='InitialPass123!',
			registration_password='InitialPass123!'
		)

		self.assertEqual(user.registration_password, 'InitialPass123!')
		self.assertTrue(user.check_password('InitialPass123!'))

	def test_set_password_updates_registration_password(self):
		user = Profile.objects.create_user(
			username='reset-user',
			email='reset@example.com',
			password='InitialPass123!'
		)

		user.set_password('UpdatedPass456!')
		user.save()
		user.refresh_from_db()

		self.assertEqual(user.registration_password, 'UpdatedPass456!')
		self.assertTrue(user.check_password('UpdatedPass456!'))

	def test_reset_sovtes_user_password_updates_registration_password(self):
		user = Profile.objects.create_user(
			username='sovtes_reset_user',
			email='sovtes-reset@example.com',
			password='InitialPass123!',
			registration_password='InitialPass123!'
		)

		new_password = SovtesUserManager.reset_sovtes_user_password(user)
		user.refresh_from_db()

		self.assertEqual(user.registration_password, new_password)
		self.assertTrue(user.check_password(new_password))


class SystemAdminPasswordResetTests(TestCase):
	def setUp(self):
		self.api_client = APIClient()
		self.system_admin_role = Role.objects.create(name='system_admin')
		self.admin_role = Role.objects.create(name='admin')
		self.system_admin = Profile.objects.create_user(
			username='system-admin',
			email='system-admin@example.com',
			password='SystemAdmin123!',
			role=self.system_admin_role,
		)
		self.regular_admin = Profile.objects.create_user(
			username='tenant-admin',
			email='tenant-admin@example.com',
			password='TenantAdmin123!',
			role=self.admin_role,
		)
		self.target_user = Profile.objects.create_user(
			username='target-user',
			email='target@example.com',
			password='InitialPass123!',
			registration_password='InitialPass123!',
		)

	def test_system_admin_can_reset_user_password(self):
		self.api_client.force_authenticate(user=self.system_admin)

		response = self.api_client.post(f'/api/users/{self.target_user.id}/reset-password/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.target_user.refresh_from_db()
		new_password = response.data['temporary_password']
		self.assertEqual(self.target_user.registration_password, new_password)
		self.assertTrue(self.target_user.check_password(new_password))

	def test_non_system_admin_cannot_reset_user_password(self):
		self.api_client.force_authenticate(user=self.regular_admin)

		response = self.api_client.post(f'/api/users/{self.target_user.id}/reset-password/')

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_system_admin_can_list_users(self):
		self.api_client.force_authenticate(user=self.system_admin)

		response = self.api_client.get('/api/users/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(any(user['id'] == self.target_user.id for user in response.data))

	def test_client_admin_list_excludes_system_admin_users(self):
		client = Client.objects.create(
			name='Tenant Client',
			slug='tenant-client',
			is_active=True,
			is_approved=True,
			approval_status='approved',
		)
		client_admin_role = Role.objects.create(name='client_admin')
		client_admin = Profile.objects.create_user(
			username='tenant-admin-user',
			email='tenant-admin-user@example.com',
			password='TenantAdmin123!',
			role=client_admin_role,
			client=client,
			is_staff=True,
			is_superuser=True,
		)
		tenant_user = Profile.objects.create_user(
			username='tenant-employee',
			email='tenant-employee@example.com',
			password='TenantEmployee123!',
			client=client,
		)
		system_user = Profile.objects.create_user(
			username='tenant-system-user',
			email='tenant-system-user@example.com',
			password='SystemUser123!',
			role=self.system_admin_role,
			client=client,
		)

		self.api_client.force_authenticate(user=client_admin)

		response = self.api_client.get('/api/users/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		returned_ids = {user['id'] for user in response.data}
		self.assertIn(tenant_user.id, returned_ids)
		self.assertNotIn(system_user.id, returned_ids)


class ProfileAdminPasswordResetTests(TestCase):
	def setUp(self):
		self.factory = RequestFactory()
		self.client.force_login(
			Profile.objects.create_superuser(
				username='django-admin',
				email='django-admin@example.com',
				password='Admin123!'
			)
		)
		self.target_user = Profile.objects.create_user(
			username='admin-reset-target',
			email='admin-reset@example.com',
			password='InitialPass123!',
			registration_password='InitialPass123!'
		)
		self.system_admin_role = Role.objects.create(name='system_admin')
		self.non_system_admin = Profile.objects.create_user(
			username='client-admin',
			email='client-admin@example.com',
			password='ClientAdmin123!',
			role=Role.objects.create(name='client_admin'),
			is_staff=True,
		)
		self.system_admin = Profile.objects.create_user(
			username='system-admin-visibility',
			email='system-admin-visibility@example.com',
			password='SystemAdmin123!',
			role=self.system_admin_role,
			is_staff=True,
		)
		self.profile_admin = ProfileAdmin(Profile, admin.site)

	def test_admin_reset_password_view_updates_registration_password(self):
		response = self.client.get(
			reverse('admin:user_profile_reset_password', args=[self.target_user.id]),
			follow=True,
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.target_user.refresh_from_db()
		self.assertNotEqual(self.target_user.registration_password, 'InitialPass123!')
		self.assertTrue(self.target_user.check_password(self.target_user.registration_password))

	def test_reset_controls_hidden_for_non_system_admin(self):
		request = self.factory.get('/admin/user/profile/')
		request.user = self.non_system_admin

		list_display = self.profile_admin.get_list_display(request)
		readonly_fields = self.profile_admin.get_readonly_fields(request, self.target_user)
		fieldsets = self.profile_admin.get_fieldsets(request, self.target_user)

		self.assertNotIn('reset_password_link', list_display)
		self.assertNotIn('reset_password_action', readonly_fields)
		self.assertNotIn('reset_password_action', fieldsets[1][1]['fields'])

	def test_reset_controls_visible_for_system_admin(self):
		request = self.factory.get('/admin/user/profile/')
		request.user = self.system_admin

		list_display = self.profile_admin.get_list_display(request)
		readonly_fields = self.profile_admin.get_readonly_fields(request, self.target_user)
		fieldsets = self.profile_admin.get_fieldsets(request, self.target_user)

		self.assertIn('reset_password_link', list_display)
		self.assertIn('reset_password_action', readonly_fields)
		self.assertIn('reset_password_action', fieldsets[1][1]['fields'])


class AdminDashboardStatsTests(TestCase):
	def setUp(self):
		self.api_client = APIClient()
		self.system_admin_role = Role.objects.create(name='system_admin')
		self.client_admin_role = Role.objects.create(name='client_admin')
		self.system_admin = Profile.objects.create_user(
			username='stats-system-admin',
			email='stats-system-admin@example.com',
			password='SystemAdmin123!',
			role=self.system_admin_role,
		)
		self.non_system_admin = Profile.objects.create_user(
			username='stats-client-admin',
			email='stats-client-admin@example.com',
			password='ClientAdmin123!',
			role=self.client_admin_role,
		)
		self.client = Client.objects.create(
			name='Dashboard Client',
			slug='dashboard-client',
			is_active=True,
			is_approved=True,
			approval_status='approved',
		)
		self.pending_client = Client.objects.create(
			name='Pending Client',
			slug='pending-client',
			is_active=False,
			is_approved=False,
			approval_status='pending',
		)
		self.managed_user = Profile.objects.create_user(
			username='managed-user',
			email='managed-user@example.com',
			password='ManagedUser123!',
			client=self.client,
		)
		self.plan = SubscriptionPlan.objects.create(
			name='base',
			display_name='Base',
			description='Base plan',
			truck_limit=5,
			monthly_price='99.00',
			yearly_price='999.00',
			features=['Employee Management'],
		)
		self.requested_plan = SubscriptionPlan.objects.create(
			name='pro',
			display_name='Pro',
			description='Pro plan',
			truck_limit=15,
			monthly_price='199.00',
			yearly_price='1999.00',
			features=['Employee Management', 'Analytics'],
		)
		self.subscription = ClientSubscription.objects.create(
			client=self.client,
			plan=self.plan,
			billing_cycle='monthly',
			status='active',
			start_date=timezone.now(),
			end_date=timezone.now() + timezone.timedelta(days=30),
		)
		SubscriptionPlanChangeRequest.objects.create(
			client=self.client,
			current_subscription=self.subscription,
			requested_plan=self.requested_plan,
			billing_cycle='monthly',
			status='pending',
			requested_by=self.system_admin,
		)

	def test_system_admin_can_fetch_dashboard_stats(self):
		self.api_client.force_authenticate(user=self.system_admin)

		response = self.api_client.get('/api/admin/dashboard-stats/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['totalClients'], 2)
		self.assertEqual(response.data['totalUsers'], 3)
		self.assertEqual(response.data['activeSubscriptions'], 1)
		self.assertEqual(response.data['pendingApprovals'], 1)
		self.assertEqual(response.data['pendingPlanChanges'], 1)
		self.assertEqual(response.data['totalRevenue'], 99.0)
		self.assertTrue(len(response.data['recentActivity']) >= 3)

	def test_non_system_admin_cannot_fetch_dashboard_stats(self):
		self.api_client.force_authenticate(user=self.non_system_admin)

		response = self.api_client.get('/api/admin/dashboard-stats/')

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ClientExternalIdentityTests(TestCase):
	def setUp(self):
		self.api_client = APIClient()
		self.system_admin_role = Role.objects.create(name='system_admin')
		self.system_admin = Profile.objects.create_user(
			username='external-identity-admin',
			email='external-identity-admin@example.com',
			password='SystemAdmin123!',
			role=self.system_admin_role,
		)

	def test_registration_creates_pending_sovtes_identity(self):
		payload = {
			'client': {
				'name': 'Identity Client',
				'slug': 'identity-client',
			},
			'admin_user': {
				'username': 'identity-admin',
				'email': 'identity-admin@example.com',
				'password1': 'IdentityPass123!',
				'password2': 'IdentityPass123!',
				'first_name': 'Identity',
				'last_name': 'Admin',
			},
			'company': {
				'name': 'Identity Company',
			},
		}

		response = self.api_client.post('/api/users/register-client/', payload, format='json')

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertIn('sovtes_link_key', response.data)

		client = Client.objects.get(slug='identity-client')
		identity = ClientExternalIdentity.objects.get(client=client, provider=ClientExternalIdentity.PROVIDER_SOVTES)
		self.assertEqual(identity.link_status, ClientExternalIdentity.STATUS_PENDING)
		self.assertIsNone(identity.external_client_id)

	def test_system_admin_can_link_external_identity(self):
		client = Client.objects.create(name='Manual Link Client', slug='manual-link-client')
		identity = ClientExternalIdentity.objects.create(
			client=client,
			provider=ClientExternalIdentity.PROVIDER_SOVTES,
			link_status=ClientExternalIdentity.STATUS_PENDING,
		)

		self.api_client.force_authenticate(user=self.system_admin)
		response = self.api_client.post(
			f'/api/admin/external-identities/{identity.id}/link/',
			{'external_client_id': 'sovtes-client-501'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		identity.refresh_from_db()
		self.assertEqual(identity.external_client_id, 'sovtes-client-501')
		self.assertEqual(identity.link_status, ClientExternalIdentity.STATUS_LINKED)

	def test_sovtes_link_key_auto_binds_pending_identity(self):
		client = Client.objects.create(name='Auto Bind Client', slug='auto-bind-client')
		identity = ClientExternalIdentity.objects.create(
			client=client,
			provider=ClientExternalIdentity.PROVIDER_SOVTES,
			link_status=ClientExternalIdentity.STATUS_PENDING,
		)

		resolved_client = SovtesUserManager.get_or_create_client(
			client_id='sovtes-client-777',
			client_name='Sovtes Company 777',
			link_key=str(identity.link_key),
		)

		self.assertEqual(resolved_client.id, client.id)
		identity.refresh_from_db()
		self.assertEqual(identity.external_client_id, 'sovtes-client-777')
		self.assertEqual(identity.link_status, ClientExternalIdentity.STATUS_LINKED)


class ClientRegistrationValidationTests(TestCase):
	def test_rejects_phone_number_longer_than_model_limit(self):
		response = APIClient().post(
			'/api/users/register-client/',
			{
				'client': {'name': 'Long Phone Client', 'slug': 'long-phone-client'},
				'admin_user': {
					'username': 'long-phone-admin',
					'email': 'admin@example.com',
					'password1': 'StrongPassword123!',
					'password2': 'StrongPassword123!',
					'phone_number': '+380991234567, +380991234568',
				},
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertEqual(response.data['error_code'], 'PHONE_NUMBER_TOO_LONG')
		self.assertFalse(Client.objects.filter(slug='long-phone-client').exists())
