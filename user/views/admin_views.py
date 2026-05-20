"""
Admin views for client approval system
"""
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from base.entry_data import email_sender, gmail_password
from email.message import EmailMessage
import ssl
import smtplib
import logging

from base.models import Client
from base.subscription_models import ClientSubscription, SubscriptionPlanChangeRequest
from user.models import Profile
from user.serializers import UserSerializer
from user.views.user_views import SystemAdminPermission

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([SystemAdminPermission])
def dashboard_stats(request):
    try:
        total_clients = Client.objects.count()
        total_users = Profile.objects.count()
        active_subscriptions = ClientSubscription.objects.filter(status='active').select_related('plan')
        pending_approvals = Client.objects.filter(approval_status='pending').count()
        pending_plan_changes = SubscriptionPlanChangeRequest.objects.filter(status='pending').count()

        total_revenue = Decimal('0')
        for subscription in active_subscriptions:
            price = subscription.get_current_price()
            if subscription.billing_cycle == 'yearly':
                price = price / Decimal('12')
            total_revenue += price

        activity_items = []

        for client in Client.objects.order_by('-created_at')[:5]:
            activity_items.append({
                'id': f'client-{client.id}',
                'type': 'client_registration',
                'message': f'Client registered: {client.name}',
                'timestamp': client.created_at,
            })

        for request_item in SubscriptionPlanChangeRequest.objects.select_related('client', 'requested_plan').order_by('-requested_at')[:5]:
            activity_items.append({
                'id': f'plan-change-{request_item.id}',
                'type': 'plan_change',
                'message': f'{request_item.client.name} requested {request_item.requested_plan.display_name}',
                'timestamp': request_item.requested_at,
            })

        for subscription in active_subscriptions.order_by('-created_at')[:5]:
            activity_items.append({
                'id': f'subscription-{subscription.id}',
                'type': 'subscription',
                'message': f'Active subscription for {subscription.client.name}: {subscription.plan.display_name}',
                'timestamp': subscription.created_at,
            })

        recent_activity = sorted(
            activity_items,
            key=lambda item: item['timestamp'],
            reverse=True,
        )[:6]

        return Response({
            'totalClients': total_clients,
            'totalUsers': total_users,
            'activeSubscriptions': active_subscriptions.count(),
            'pendingApprovals': pending_approvals,
            'pendingPlanChanges': pending_plan_changes,
            'totalRevenue': float(total_revenue),
            'recentActivity': recent_activity,
        })

    except Exception as e:
        logger.error(f'Failed to fetch admin dashboard stats: {str(e)}')
        return Response({
            'detail': 'Failed to fetch dashboard statistics'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([SystemAdminPermission])
def list_pending_clients(request):
    """List all pending client registrations"""
    try:
        clients = Client.objects.filter(approval_status='pending').order_by('-created_at')
        
        client_data = []
        for client in clients:
            admin_user = client.users.filter(is_staff=True).first()
            company = client.company_set.first()
            
            client_data.append({
                'id': client.id,
                'name': client.name,
                'slug': client.slug,
                'approval_status': client.approval_status,
                'created_at': client.created_at,
                'admin_user': {
                    'id': admin_user.id if admin_user else None,
                    'full_name': admin_user.get_full_name() if admin_user else '',
                    'email': admin_user.email if admin_user else '',
                    'phone_number': admin_user.phone_number if admin_user else '',
                } if admin_user else None,
                'company': {
                    'name': company.name if company else '',
                    'email': company.email if company else '',
                    'phone': company.phone if company else '',
                    'vat_number': company.vat_number if company else '',
                    'post_address': company.post_address if company else '',
                } if company else None
            })
        
        return Response(client_data)
        
    except Exception as e:
        logger.error(f'Failed to list pending clients: {str(e)}')
        return Response({
            'detail': 'Failed to fetch pending clients'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([SystemAdminPermission])
def approve_client(request, client_id):
    """Approve a client registration"""
    try:
        client = Client.objects.get(id=client_id)
        
        if client.approval_status != 'pending':
            return Response({
                'success': False,
                'message': f'Client is already {client.approval_status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Update client status
            client.is_approved = True
            client.is_active = True
            client.approval_status = 'approved'
            client.approved_by = request.user
            client.approved_at = timezone.now()
            client.save()
            
            # Activate admin user
            admin_user = client.users.filter(is_staff=True).first()
            if admin_user:
                admin_user.is_active = True
                admin_user.save()
                
                # Send approval email
                send_approval_email(client, admin_user)
            
            # Activate pending subscription if exists, or create default subscription
            pending_subscription = ClientSubscription.objects.filter(
                client=client,
                status='pending'
            ).first()
            
            if pending_subscription:
                pending_subscription.status = 'active'
                pending_subscription.save()
                logger.info(f'Activated subscription for client {client.name}: {pending_subscription.plan.display_name}')
            else:
                # No pending subscription found, create a default base plan
                from base.subscription_models import SubscriptionPlan
                from datetime import timedelta
                
                try:
                    base_plan = SubscriptionPlan.objects.get(name='base', is_active=True)
                    start_date = timezone.now()
                    end_date = start_date + timedelta(days=30)  # Monthly billing
                    
                    default_subscription = ClientSubscription.objects.create(
                        client=client,
                        plan=base_plan,
                        billing_cycle='monthly',
                        status='active',
                        start_date=start_date,
                        end_date=end_date,
                        auto_renew=True
                    )
                    
                    logger.info(f'Created default subscription for client {client.name}: {base_plan.display_name}')
                    
                except SubscriptionPlan.DoesNotExist:
                    logger.warning(f'No base plan found - client {client.name} approved without subscription')
                except Exception as e:
                    logger.error(f'Failed to create default subscription for client {client.name}: {str(e)}')
        
        logger.info(f'Client {client.name} approved by {request.user.username}')
        
        return Response({
            'success': True,
            'message': f'Client {client.name} has been approved successfully.'
        })
        
    except Client.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Client not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f'Failed to approve client {client_id}: {str(e)}')
        return Response({
            'success': False,
            'message': 'Failed to approve client. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([SystemAdminPermission])
def reject_client(request, client_id):
    """Reject a client registration"""
    try:
        client = Client.objects.get(id=client_id)
        rejection_reason = request.data.get('reason', '')
        
        if client.approval_status != 'pending':
            return Response({
                'success': False,
                'message': f'Client is already {client.approval_status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not rejection_reason.strip():
            return Response({
                'success': False,
                'message': 'Rejection reason is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Update client status
            client.is_approved = False
            client.approval_status = 'rejected'
            client.rejection_reason = rejection_reason
            client.approved_by = request.user
            client.approved_at = timezone.now()
            client.save()
            
            # Send rejection email
            admin_user = client.users.filter(is_staff=True).first()
            if admin_user:
                send_rejection_email(client, admin_user, rejection_reason)
            
            # Cancel pending subscription if exists  
            pending_subscription = ClientSubscription.objects.filter(
                client=client,
                status='pending'
            ).first()
            
            if pending_subscription:
                pending_subscription.status = 'cancelled'
                pending_subscription.save()
                logger.info(f'Cancelled pending subscription for rejected client {client.name}')
        
        logger.info(f'Client {client.name} rejected by {request.user.username}')
        
        return Response({
            'success': True,
            'message': f'Client {client.name} has been rejected.'
        })
        
    except Client.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Client not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f'Failed to reject client {client_id}: {str(e)}')
        return Response({
            'success': False,
            'message': 'Failed to reject client. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def send_approval_email(client, admin_user):
    """Send approval notification email"""
    try:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        
        subject = 'Welcome to Malog TMS - Account Approved!'
        body = f'''
Dear {admin_user.get_full_name()},

Great news! Your Malog TMS account for {client.name} has been approved and is now active.

You can now log in at: {frontend_url}/login

Username: {admin_user.username}

Welcome to Malog TMS!

Best regards,
The Malog Team
        '''
        
        send_email_via_smtp_admin(subject, body, admin_user.email)
        logger.info(f'Approval email sent to {admin_user.email} for client {client.name}')
        
    except Exception as e:
        logger.error(f'Failed to send approval email: {str(e)}')


def send_rejection_email(client, admin_user, reason):
    """Send rejection notification email"""
    try:
        subject = 'Malog TMS Registration Update'
        body = f'''
Dear {admin_user.get_full_name()},

We regret to inform you that your Malog TMS registration for {client.name} has not been approved at this time.

Reason: {reason}

If you have any questions or would like to reapply, please contact us at support@malog.com.

Best regards,
The Malog Team
        '''
        
        send_email_via_smtp_admin(subject, body, admin_user.email)
        logger.info(f'Rejection email sent to {admin_user.email} for client {client.name}')
        
    except Exception as e:
        logger.error(f'Failed to send rejection email: {str(e)}')


def send_email_via_smtp_admin(subject, body, recipient_email):
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
            logger.info(f"Admin email sent successfully to {recipient_email}")
            
    except Exception as e:
        logger.error(f'Failed to send admin email to {recipient_email}: {str(e)}')