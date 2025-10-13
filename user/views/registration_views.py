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
from base.models import Client, Company
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
        
        # Extract data from request
        client_data = data.get('client', {})
        admin_user_data = data.get('admin_user', {})
        company_data = data.get('company', {})
        subscription_data = data.get('subscription', {})
        
        # Validate required fields
        if not client_data.get('name'):
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
            client = Client.objects.create(
                name=client_data['name'],
                slug=client_data['slug'],
                is_active=False,  # Inactive until approved
                is_approved=False,
                approval_status='pending'
            )
            
            # Set current client for tenant-aware models
            set_current_client(client)
            
            # Create admin user but mark as inactive until approved
            admin_user = Profile.objects.create_user(
                username=admin_user_data['username'],
                email=admin_user_data['email'],
                password=admin_user_data['password1'],
                first_name=admin_user_data.get('first_name', ''),
                last_name=admin_user_data.get('last_name', ''),
                phone_number=admin_user_data.get('phone_number', ''),
                client=client,
                is_staff=True,  # Give admin access (makes is_admin=True)
                is_superuser=True,  # Give superuser privileges within their tenant
                is_active=False  # Inactive until approved
            )
            
            # Get or create admin role
            admin_role, created = Role.objects.get_or_create(
                name='admin',
                defaults={'name': 'admin'}
            )
            admin_user.role = admin_role
            admin_user.save()
            
            # Create company with explicit client assignment
            company = Company.objects.create(
                name=company_data.get('name', client_data['name']),
                email=company_data.get('email', ''),
                phone=company_data.get('phone', ''),
                post_address=company_data.get('address', ''),
                vat_number=company_data.get('vat_number', ''),
                client=client
            )
            
            # Create subscription if specified
            if subscription_data and subscription_data.get('plan'):
                try:
                    plan_name = subscription_data.get('plan', 'base')
                    billing_cycle = subscription_data.get('billing_cycle', 'monthly')
                    
                    # Get the subscription plan
                    subscription_plan = SubscriptionPlan.objects.get(name=plan_name, is_active=True)
                    
                    # Calculate subscription dates (start with pending status)
                    start_date = timezone.now()
                    if billing_cycle == 'yearly':
                        end_date = start_date + timedelta(days=365)
                    else:
                        end_date = start_date + timedelta(days=30)
                    
                    # Create client subscription with pending status
                    client_subscription = ClientSubscription.objects.create(
                        client=client,
                        plan=subscription_plan,
                        billing_cycle=billing_cycle,
                        status='pending',  # Will be activated when client is approved
                        start_date=start_date,
                        end_date=end_date,
                        auto_renew=True
                    )
                    
                    logger.info(f'Created subscription for client {client.name}: {subscription_plan.display_name} ({billing_cycle})')
                    
                except SubscriptionPlan.DoesNotExist:
                    logger.warning(f'Subscription plan "{plan_name}" not found for client {client.name}')
                except Exception as e:
                    logger.error(f'Failed to create subscription for client {client.name}: {str(e)}')
            
            # Send notification emails
            send_registration_notifications(client, admin_user)
            
            # Return success response without tokens (no auto-login for pending approval)
            response_data = {
                'success': True,
                'message': 'Registration submitted successfully! Your account is pending approval.',
                'client_id': client.id,
                'client_name': client.name,
                'client_slug': client.slug,
                'approval_status': 'pending',
                'admin_email': admin_user.email
            }
            
            logger.info(f'New client registered pending approval: {client.name} by {admin_user.username}')
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f'Client registration failed: {str(e)}', exc_info=True)
        return Response({
            'detail': 'Registration failed. Please try again.',
            'error': str(e),
            'type': type(e).__name__
        }, status=status.HTTP_400_BAD_REQUEST)


def send_registration_notifications(client, admin_user):
    """Send notification emails for new registration"""
    try:
        # Email to system admins
        system_admin_email = getattr(settings, 'SYSTEM_ADMIN_EMAIL', 'admin@malog.com')
        
        # Email to Malog system admins
        admin_subject = f'New Client Registration: {client.name}'
        admin_body = f'''
A new client has registered and needs approval:

Company: {client.name}
Slug: {client.slug}
Admin User: {admin_user.get_full_name()} ({admin_user.email})
Registration Date: {client.created_at}

Please review and approve/reject this registration in the admin panel.

Best regards,
Malog System
        '''
        
        send_email_via_smtp_registration(admin_subject, admin_body, system_admin_email)
        
        # Email to the registering user
        user_subject = 'Registration Received - Pending Approval'
        user_body = f'''
Dear {admin_user.get_full_name()},

Thank you for registering with Malog TMS. Your registration for {client.name} has been received and is currently pending approval.

You will receive another email once your account has been reviewed and approved by our team.

Best regards,
The Malog Team
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
        with smtplib.SMTP('smtp.gmail.com', 587) as smtp:
            smtp.ehlo()  # Identify with the server
            smtp.starttls(context=context)  # Upgrade to secure connection
            smtp.ehlo()  # Re-identify after starting TLS
            smtp.login(email_sender, gmail_password)
            smtp.send_message(email_message)
            logger.info(f"Registration email sent successfully to {recipient_email}")
            
    except Exception as e:
        logger.error(f'Failed to send registration email to {recipient_email}: {str(e)}')