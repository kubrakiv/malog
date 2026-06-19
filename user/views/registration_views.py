"""
API views for client registration
"""
from django.shortcuts import render
from django.contrib.auth import login
from django.contrib import messages
from django.db import transaction
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from base.models import Client, Company, ClientExternalIdentity
from base.subscription_models import SubscriptionPlan, ClientSubscription
from user.models import Profile, Role
from user.serializers import UserSerializer
from django.conf import settings
from base.entry_data import email_sender, gmail_password
from base.tenant import set_current_client
from email.message import EmailMessage
import ssl
import smtplib
import logging
from datetime import timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_client(request):
    """
    Register a new client with admin user and company
    """
    try:
        data = request.data
        logger.info(f"Registration request received: {data}")
        
        # Extract data from request
        client_data = data.get('client', {})
        admin_user_data = data.get('admin_user', {})
        company_data = data.get('company', {})
        subscription_data = data.get('subscription', {})
        
        logger.info(f"Client data: {client_data}")
        logger.info(f"Admin user data: {admin_user_data}")
        logger.info(f"Company data: {company_data}")
        logger.info(f"Subscription data: {subscription_data}")
        
        # Validate required fields
        if not client_data.get('name'):
            logger.error("Client name is missing")
            return Response({'detail': 'Client name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not client_data.get('slug'):
            return Response({'detail': 'Client slug is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not admin_user_data.get('username'):
            return Response({'detail': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not admin_user_data.get('email'):
            return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not admin_user_data.get('password1'):
            return Response({'detail': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if admin_user_data.get('password1') != admin_user_data.get('password2'):
            return Response({'detail': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if client slug already exists
        if Client.objects.filter(slug=client_data['slug']).exists():
            # Generate alternative slug suggestions
            base_slug = client_data['slug']
            suggestions = []
            for i in range(2, 6):  # Generate 4 alternatives
                alt_slug = f"{base_slug}-{i}"
                if not Client.objects.filter(slug=alt_slug).exists():
                    suggestions.append(alt_slug)
            
            return Response({
                'detail': 'Client identifier already exists',
                'error_code': 'SLUG_EXISTS',
                'suggestions': suggestions[:3],  # Return top 3 suggestions
                'current_slug': client_data['slug']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username already exists
        if Profile.objects.filter(username=admin_user_data['username']).exists():
            return Response({'detail': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email already exists
        if Profile.objects.filter(email=admin_user_data['email']).exists():
            return Response({'detail': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Create client with pending approval status
            logger.info(f"Creating client: {client_data['name']} with slug: {client_data['slug']}")
            try:
                client = Client.objects.create(
                    name=client_data['name'],
                    slug=client_data['slug'],
                    is_active=False,
                    is_approved=False,
                    approval_status='pending'
                )
                logger.info(f"Client created successfully: {client.id}")
            except Exception as e:
                logger.error(f"Failed to create client: {str(e)}")
                raise
            
            # Set current client for tenant-aware models
            set_current_client(client)

            # Create pending Sovtes mapping for future explicit linking.
            sovtes_identity, _ = ClientExternalIdentity.objects.get_or_create(
                client=client,
                provider=ClientExternalIdentity.PROVIDER_SOVTES,
                defaults={
                    'link_status': ClientExternalIdentity.STATUS_PENDING,
                    'metadata': {'created_via': 'tms_registration'},
                },
            )
            
            # Create admin user but mark as inactive until approved
            logger.info(f"Creating admin user: {admin_user_data['username']}")
            try:
                admin_user = Profile.objects.create_user(
                    username=admin_user_data['username'],
                    email=admin_user_data['email'],
                    password=admin_user_data['password1'],
                    first_name=admin_user_data.get('first_name', ''),
                    last_name=admin_user_data.get('last_name', ''),
                    phone_number=admin_user_data.get('phone_number', ''),
                    registration_password=admin_user_data['password1'],
                    client=client,
                    is_staff=True,  # Give admin access (makes is_admin=True)
                    is_superuser=True,  # Give superuser privileges within their tenant
                    is_active=False  # Inactive until approved
                )
                logger.info(f"Admin user created successfully: {admin_user.id}")
            except Exception as e:
                logger.error(f"Failed to create admin user: {str(e)}")
                raise
            
            # Get or create client_admin role
            try:
                admin_role, created = Role.objects.get_or_create(
                    name='client_admin',
                    defaults={'name': 'client_admin'}
                )
                admin_user.role = admin_role
                admin_user.save()
                logger.info(f"client_admin role assigned successfully")
            except Exception as e:
                logger.error(f"Failed to assign admin role: {str(e)}")
                raise
            
            # Create company with explicit client assignment
            logger.info(f"Creating company: {company_data.get('name', client_data['name'])}")
            try:
                company = Company.objects.create(
                    name=company_data.get('name', client_data['name']),
                    name_en=company_data.get('name_en', ''),
                    email=company_data.get('email', ''),
                    phone=company_data.get('phone', ''),
                    post_address=company_data.get('address', ''),
                    legal_address=company_data.get('legal_address', ''),
                    vat_number=company_data.get('vat_number', ''),
                    client=client
                )
                logger.info(f"Company created successfully: {company.id}")
            except Exception as e:
                logger.error(f"Failed to create company: {str(e)}")
                raise
            
            # Create subscription if specified
            if subscription_data and subscription_data.get('plan'):
                try:
                    plan_name = subscription_data.get('plan', 'base')
                    billing_cycle = subscription_data.get('billing_cycle', 'monthly')
                    pricing_model = subscription_data.get('pricing_model', 'total')

                    logger.info(f"Creating subscription with plan: {plan_name}, billing: {billing_cycle}, pricing_model: {pricing_model}")
                    
                    # Get the subscription plan
                    subscription_plan = SubscriptionPlan.objects.get(name=plan_name, is_active=True)
                    
                    # Calculate subscription dates 
                    start_date = timezone.now()
                    
                    # Handle trial vs regular subscriptions differently
                    if subscription_plan.is_trial_plan:
                        # Trial subscription setup
                        trial_end_date = start_date + timedelta(days=subscription_plan.trial_duration_days)
                        end_date = trial_end_date
                        
                        client_subscription = ClientSubscription.objects.create(
                            client=client,
                            plan=subscription_plan,
                            billing_cycle=billing_cycle,
                            pricing_model=pricing_model,
                            status='pending',  # Will become 'trial' when client is approved
                            start_date=start_date,
                            end_date=end_date,
                            is_trial=True,
                            trial_end_date=trial_end_date,
                            auto_renew=False  # Trials don't auto-renew
                        )
                        
                        logger.info(f'Created trial subscription for client {client.name}: {subscription_plan.display_name} (trial period: {subscription_plan.trial_duration_days} days)')
                    else:
                        # Regular subscription setup
                        if billing_cycle == 'yearly':
                            end_date = start_date + timedelta(days=365)
                        else:
                            end_date = start_date + timedelta(days=30)
                        
                        client_subscription = ClientSubscription.objects.create(
                            client=client,
                            plan=subscription_plan,
                            billing_cycle=billing_cycle,
                            pricing_model=pricing_model,
                            status='pending',  # Will be activated when client is approved
                            start_date=start_date,
                            end_date=end_date,
                            is_trial=False,
                            auto_renew=True
                        )
                        
                        logger.info(f'Created subscription for client {client.name}: {subscription_plan.display_name} ({billing_cycle})')
                    
                except SubscriptionPlan.DoesNotExist:
                    logger.error(f'Subscription plan "{plan_name}" not found for client {client.name}')
                    return Response({
                        'detail': f'Subscription plan "{plan_name}" not found'
                    }, status=status.HTTP_400_BAD_REQUEST)
                except Exception as e:
                    logger.error(f'Failed to create subscription for client {client.name}: {str(e)}')
                    raise
            
            # Send notification emails
            send_registration_notifications(client, admin_user)
            
            # Return success response without tokens (no auto-login for pending approval)
            response_data = {
                'success': True,
                'message': 'Registration submitted successfully! Your account is pending approval.',
                'client_id': client.id,
                'client_name': client.name,
                'client_slug': client.slug,
                'sovtes_link_key': str(sovtes_identity.link_key),
                'approval_status': 'pending',
                'admin_email': admin_user.email
            }
            
            logger.info(f'New client registered pending approval: {client.name} by {admin_user.username}')
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f'Client registration failed: {str(e)}', exc_info=True)
        
        # Return more specific error information for debugging
        error_detail = str(e)
        if 'UNIQUE constraint failed' in error_detail:
            if 'username' in error_detail:
                error_detail = 'Username already exists'
            elif 'email' in error_detail:
                error_detail = 'Email already exists'
            elif 'slug' in error_detail:
                error_detail = 'Client identifier already exists'
        
        return Response({
            'detail': error_detail,
            'error': str(e),
            'type': type(e).__name__
        }, status=status.HTTP_400_BAD_REQUEST)


def send_registration_notifications(client, admin_user):
    """Send notification emails for new registration"""
    try:
        # Email to system admins
        system_admin_email = getattr(settings, 'SYSTEM_ADMIN_EMAIL', 'admin@sovtes.com.ua')
        
        # Email to TMS SOVTES admins
        admin_subject = f'New Client Registration: {client.name}'
        admin_body = f'''
A new client has registered and needs approval:

Company: {client.name}
Slug: {client.slug}
Admin User: {admin_user.get_full_name()} ({admin_user.email})
Registration Date: {client.created_at}

Please review and approve/reject this registration in the admin panel.

Best regards,
TMS SOVTES
        '''
        
        send_email_via_smtp_registration(admin_subject, admin_body, system_admin_email)
        
        # Email to the registering user
        user_subject = 'Registration Received - Pending Approval'
        user_body = f'''
Dear {admin_user.get_full_name()},

Thank you for registering with TMS SOVTES. Your registration for {client.name} has been received and is currently pending approval.

You will receive another email once your account has been reviewed and approved by our team.

Best regards,
The TMS SOVTES Team
        '''
        
        send_email_via_smtp_registration(user_subject, user_body, admin_user.email)
        
        logger.info(f'Registration notification emails sent for client: {client.name}')
        
    except Exception as e:
        logger.error(f'Failed to send registration notification emails: {str(e)}')


def send_email_via_smtp_registration(subject, body, recipient_email):
    """Send email using SMTP with the same logic as send_email_views.py"""
    try:
        # Create email message
        email_message = EmailMessage()
        email_message['From'] = email_sender
        email_message['To'] = recipient_email
        email_message['Subject'] = subject
        email_message.set_content(body)

        # Send email using SMTP with STARTTLS
        context = ssl.create_default_context()
        with smtplib.SMTP('smtp-relay.gmail.com', 587) as smtp:
            smtp.ehlo()  # Identify with the server
            smtp.starttls(context=context)  # Upgrade to secure connection
            smtp.ehlo()  # Re-identify after starting TLS
            smtp.send_message(email_message)
            logger.info(f"Registration email sent successfully to {recipient_email}")

    except Exception as e:
        logger.error(f'Failed to send registration email to {recipient_email}: {str(e)}')