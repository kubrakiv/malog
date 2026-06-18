from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta

from base.subscription_models import SubscriptionPlan, ClientSubscription, SubscriptionUsage, SubscriptionPlanChangeRequest
from base.subscription_serializers import (
    SubscriptionPlanSerializer, 
    ClientSubscriptionSerializer,
    SubscriptionUsageSerializer,
    SubscriptionPlanChangeRequestSerializer
)
from base.models import Truck, Client


@api_view(['GET'])
def get_subscription_plans(request):
    """Get all available subscription plans"""
    plans = SubscriptionPlan.objects.filter(is_active=True)
    serializer = SubscriptionPlanSerializer(plans, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_client_subscription(request):
    """Get current client's subscription details"""
    try:
        client = request.user.client
        subscription = ClientSubscription.objects.get(client=client, status='active')
        serializer = ClientSubscriptionSerializer(subscription, context={'request': request})

        # Add current usage data
        current_truck_count = Truck.objects.filter(client=client).count()
        
        response_data = serializer.data
        response_data['current_usage'] = {
            'truck_count': current_truck_count,
            'truck_limit': subscription.plan.truck_limit,
            'can_add_truck': subscription.can_create_truck(current_truck_count)
        }
        
        return Response(response_data)
    except ClientSubscription.DoesNotExist:
        return Response(
            {'error': 'No active subscription found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_subscription(request):
    """Create a new subscription for the client"""
    try:
        client = request.user.client
        plan_id = request.data.get('plan_id')
        billing_cycle = request.data.get('billing_cycle', 'monthly')
        
        # Check if client already has an active subscription
        existing_subscription = ClientSubscription.objects.filter(
            client=client, 
            status='active'
        ).first()
        
        if existing_subscription:
            return Response(
                {'error': 'Client already has an active subscription'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        plan = get_object_or_404(SubscriptionPlan, id=plan_id, is_active=True)
        
        # Calculate subscription dates
        start_date = timezone.now()
        if billing_cycle == 'yearly':
            end_date = start_date + timedelta(days=365)
        else:
            end_date = start_date + timedelta(days=30)
        
        subscription = ClientSubscription.objects.create(
            client=client,
            plan=plan,
            billing_cycle=billing_cycle,
            start_date=start_date,
            end_date=end_date,
            status='active'
        )

        serializer = ClientSubscriptionSerializer(subscription, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def upgrade_subscription(request):
    """Upgrade client's subscription plan"""
    try:
        client = request.user.client
        new_plan_id = request.data.get('plan_id')
        
        current_subscription = ClientSubscription.objects.get(
            client=client, 
            status='active'
        )
        
        new_plan = get_object_or_404(SubscriptionPlan, id=new_plan_id, is_active=True)
        
        # Check if it's actually an upgrade
        if new_plan.monthly_price <= current_subscription.plan.monthly_price:
            return Response(
                {'error': 'Can only upgrade to a higher-tier plan'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the subscription
        current_subscription.plan = new_plan
        current_subscription.save()

        serializer = ClientSubscriptionSerializer(current_subscription, context={'request': request})
        return Response(serializer.data)
        
    except ClientSubscription.DoesNotExist:
        return Response(
            {'error': 'No active subscription found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_subscription(request):
    """Cancel client's subscription"""
    try:
        client = request.user.client
        subscription = ClientSubscription.objects.get(client=client, status='active')
        
        subscription.status = 'cancelled'
        subscription.auto_renew = False
        subscription.save()

        serializer = ClientSubscriptionSerializer(subscription, context={'request': request})
        return Response(serializer.data)
        
    except ClientSubscription.DoesNotExist:
        return Response(
            {'error': 'No active subscription found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_feature_access(request, feature_name):
    """Check if client has access to a specific feature"""
    try:
        client = request.user.client
        subscription = ClientSubscription.objects.get(client=client, status='active')
        
        has_access = subscription.can_access_feature(feature_name)
        
        return Response({
            'feature': feature_name,
            'has_access': has_access,
            'plan': subscription.plan.display_name
        })
        
    except ClientSubscription.DoesNotExist:
        return Response({
            'feature': feature_name,
            'has_access': False,
            'error': 'No active subscription'
        }, status=status.HTTP_403_FORBIDDEN)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_truck_limit(request):
    """Check if client can add more trucks"""
    try:
        client = request.user.client
        subscription = ClientSubscription.objects.get(client=client, status='active')
        
        current_truck_count = Truck.objects.filter(client=client).count()
        can_add_truck = subscription.can_create_truck(current_truck_count)
        
        return Response({
            'current_truck_count': current_truck_count,
            'truck_limit': subscription.plan.truck_limit,
            'can_add_truck': can_add_truck,
            'plan': subscription.plan.display_name
        })
        
    except ClientSubscription.DoesNotExist:
        return Response({
            'current_truck_count': 0,
            'truck_limit': 0,
            'can_add_truck': False,
            'error': 'No active subscription'
        }, status=status.HTTP_403_FORBIDDEN)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_subscription_plan(request):
    """Request a subscription plan change (requires admin approval)"""
    try:
        client = request.user.client
        plan_id = request.data.get('plan_id')
        billing_cycle = request.data.get('billing_cycle', 'monthly')
        reason = request.data.get('reason', '')
        
        if not plan_id:
            return Response(
                {'error': 'Plan ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the new plan
        new_plan = get_object_or_404(SubscriptionPlan, id=plan_id, is_active=True)
        
        # Get current subscription
        try:
            current_subscription = ClientSubscription.objects.get(client=client, status='active')
            
            # Check if it's the same plan
            if current_subscription.plan.id == new_plan.id:
                return Response(
                    {'error': 'You cannot request a change to the same plan you are currently on'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check for existing pending request
            existing_request = SubscriptionPlanChangeRequest.objects.filter(
                client=client,
                status='pending'
            ).first()
            
            if existing_request:
                return Response({
                    'error': 'You already have a pending plan change request',
                    'existing_request': SubscriptionPlanChangeRequestSerializer(existing_request, context={'request': request}).data
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create the plan change request
            change_request = SubscriptionPlanChangeRequest.objects.create(
                client=client,
                current_subscription=current_subscription,
                requested_plan=new_plan,
                billing_cycle=billing_cycle,
                reason=reason,
                requested_by=request.user
            )

            serializer = SubscriptionPlanChangeRequestSerializer(change_request, context={'request': request})
            return Response({
                'message': 'Plan change request submitted successfully. It will be reviewed by an administrator.',
                'request': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except ClientSubscription.DoesNotExist:
            return Response(
                {'error': 'No active subscription found. Please contact support.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Admin views for managing subscription plan change requests
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_plan_change_requests(request):
    """Get all pending subscription plan change requests (admin only)"""
    if not request.user.is_staff and request.user.role not in ['system_admin', 'admin']:
        return Response(
            {'error': 'Permission denied. Admin access required.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    status_filter = request.GET.get('status', 'pending')
    requests = SubscriptionPlanChangeRequest.objects.filter(status=status_filter)
    serializer = SubscriptionPlanChangeRequestSerializer(requests, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_plan_change_request(request, request_id):
    """Approve a subscription plan change request (admin only)"""
    if not request.user.is_staff and request.user.role not in ['system_admin', 'admin']:
        return Response(
            {'error': 'Permission denied. Admin access required.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        change_request = get_object_or_404(SubscriptionPlanChangeRequest, id=request_id)
        admin_notes = request.data.get('admin_notes', '')
        
        if change_request.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be approved'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Approve the request (this will update the subscription)
        change_request.approve(request.user, admin_notes)

        serializer = SubscriptionPlanChangeRequestSerializer(change_request, context={'request': request})
        return Response({
            'message': 'Plan change request approved successfully',
            'request': serializer.data
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_plan_change_request(request, request_id):
    """Reject a subscription plan change request (admin only)"""
    if not request.user.is_staff and request.user.role not in ['system_admin', 'admin']:
        return Response(
            {'error': 'Permission denied. Admin access required.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        change_request = get_object_or_404(SubscriptionPlanChangeRequest, id=request_id)
        admin_notes = request.data.get('admin_notes', '')
        
        if change_request.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be rejected'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reject the request
        change_request.reject(request.user, admin_notes)

        serializer = SubscriptionPlanChangeRequestSerializer(change_request, context={'request': request})
        return Response({
            'message': 'Plan change request rejected',
            'request': serializer.data
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_plan_change_requests(request):
    """Get current user's plan change requests"""
    try:
        client = request.user.client
        requests = SubscriptionPlanChangeRequest.objects.filter(client=client)
        serializer = SubscriptionPlanChangeRequestSerializer(requests, many=True, context={'request': request})
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Admin endpoints for subscription plan management
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_subscription_plans(request):
    """Admin endpoint to manage subscription plans"""
    # Check if user is admin
    if not request.user.is_staff and request.user.role not in ['system_admin', 'admin']:
        return Response(
            {'error': 'Permission denied. Admin access required.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        # Get all plans including inactive ones for admin
        plans = SubscriptionPlan.objects.all().order_by('name')
        serializer = SubscriptionPlanSerializer(plans, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Create new subscription plan
        serializer = SubscriptionPlanSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_subscription_plan_detail(request, plan_id):
    """Admin endpoint to manage individual subscription plan"""
    # Check if user is admin
    if not request.user.is_staff and request.user.role not in ['system_admin', 'admin']:
        return Response(
            {'error': 'Permission denied. Admin access required.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        plan = get_object_or_404(SubscriptionPlan, id=plan_id)
    except SubscriptionPlan.DoesNotExist:
        return Response(
            {'error': 'Subscription plan not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = SubscriptionPlanSerializer(plan, context={'request': request})
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = SubscriptionPlanSerializer(plan, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Check if plan is in use before deleting
        active_subscriptions = ClientSubscription.objects.filter(plan=plan, status='active').count()
        if active_subscriptions > 0:
            return Response(
                {'error': f'Cannot delete plan. It is currently used by {active_subscriptions} active subscription(s).'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        plan.delete()
        return Response(
            {'message': 'Subscription plan deleted successfully'}, 
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_client_subscriptions(request):
    """Admin endpoint to view all client subscriptions"""
    # Check if user is admin
    if not request.user.is_staff and request.user.role not in ['system_admin', 'admin']:
        return Response(
            {'error': 'Permission denied. Admin access required.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Get status filter from query params
        status_filter = request.GET.get('status', None)
        
        # Build queryset
        queryset = ClientSubscription.objects.all().select_related('client', 'plan')
        
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        # Order by most recent first
        queryset = queryset.order_by('-created_at')
        
        # Serialize data with additional client information
        subscriptions_data = []
        for subscription in queryset:
            serializer = ClientSubscriptionSerializer(subscription, context={'request': request})
            subscription_data = serializer.data
            
            # Add client name for easier display
            subscription_data['client_name'] = subscription.client.name if subscription.client else 'Unknown Client'
            
            subscriptions_data.append(subscription_data)
        
        return Response(subscriptions_data)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_client_subscription_detail(request, subscription_id):
    """Admin endpoint to manage individual client subscription"""
    # Check if user is admin
    if not request.user.is_staff and request.user.role not in ['system_admin', 'admin']:
        return Response(
            {'error': 'Permission denied. Admin access required.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        subscription = get_object_or_404(ClientSubscription, id=subscription_id)
    except ClientSubscription.DoesNotExist:
        return Response(
            {'error': 'Subscription not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = ClientSubscriptionSerializer(subscription, context={'request': request})
        subscription_data = serializer.data
        subscription_data['client_name'] = subscription.client.name if subscription.client else 'Unknown Client'
        return Response(subscription_data)

    elif request.method == 'PATCH':
        # Allow updating specific fields like status
        allowed_fields = ['status', 'end_date', 'billing_cycle']
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

        serializer = ClientSubscriptionSerializer(subscription, data=update_data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            response_data = serializer.data
            response_data['client_name'] = subscription.client.name if subscription.client else 'Unknown Client'
            return Response(response_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Delete subscription (admin only, use with caution)
        client_name = subscription.client.name if subscription.client else 'Unknown Client'
        subscription.delete()
        return Response(
            {'message': f'Subscription for {client_name} deleted successfully'}, 
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_subscription_history(request):
    """Get client's subscription history"""
    try:
        client = request.user.client
        subscriptions = ClientSubscription.objects.filter(client=client).order_by('-created_at')
        serializer = ClientSubscriptionSerializer(subscriptions, many=True, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Trial-specific views
@api_view(['POST'])
def start_trial(request):
    """Start a trial subscription for new client"""
    try:
        client_id = request.data.get('client_id')
        
        if not client_id:
            return Response(
                {'error': 'Client ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        client = get_object_or_404(Client, id=client_id)
        
        # Check if client already has any subscription
        existing_subscription = ClientSubscription.objects.filter(client=client).first()
        if existing_subscription:
            return Response(
                {'error': 'Client already has a subscription'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get trial plan
        trial_plan = SubscriptionPlan.objects.filter(
            name='trial', 
            is_active=True, 
            is_trial_plan=True
        ).first()
        
        if not trial_plan:
            return Response(
                {'error': 'Trial plan not available'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calculate trial dates
        start_date = timezone.now()
        trial_end_date = start_date + timedelta(days=trial_plan.trial_duration_days)
        
        # Create trial subscription
        subscription = ClientSubscription.objects.create(
            client=client,
            plan=trial_plan,
            billing_cycle='monthly',  # Default for trial
            start_date=start_date,
            end_date=trial_end_date,
            is_trial=True,
            trial_end_date=trial_end_date,
            status='trial',
            auto_renew=False  # Trials don't auto-renew
        )

        serializer = ClientSubscriptionSerializer(subscription, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def convert_trial_to_paid(request):
    """Convert current trial subscription to paid subscription"""
    try:
        client = request.user.client
        billing_cycle = request.data.get('billing_cycle', 'monthly')
        plan_name = request.data.get('plan', 'base')
        
        # Get current trial subscription
        trial_subscription = ClientSubscription.objects.filter(
            client=client,
            status='trial',
            is_trial=True
        ).first()
        
        if not trial_subscription:
            return Response(
                {'error': 'No active trial subscription found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get new plan
        new_plan = get_object_or_404(SubscriptionPlan, name=plan_name, is_active=True)
        if new_plan.is_trial_plan:
            return Response(
                {'error': 'Cannot convert to another trial plan'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # End trial subscription
        trial_subscription.status = 'cancelled'
        trial_subscription.end_date = timezone.now()
        trial_subscription.save()
        
        # Create new paid subscription
        start_date = timezone.now()
        if billing_cycle == 'yearly':
            end_date = start_date + timedelta(days=365)
        else:
            end_date = start_date + timedelta(days=30)
        
        paid_subscription = ClientSubscription.objects.create(
            client=client,
            plan=new_plan,
            billing_cycle=billing_cycle,
            start_date=start_date,
            end_date=end_date,
            is_trial=False,
            status='active',
            auto_renew=True,
            next_billing_date=end_date
        )

        serializer = ClientSubscriptionSerializer(paid_subscription, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def extend_trial(request):
    """Extend trial subscription (admin only)"""
    try:
        # Check if user is admin/superuser
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        client_id = request.data.get('client_id')
        additional_days = request.data.get('additional_days', 7)
        
        client = get_object_or_404(Client, id=client_id)
        
        # Get current trial subscription
        trial_subscription = ClientSubscription.objects.filter(
            client=client,
            status='trial',
            is_trial=True
        ).first()
        
        if not trial_subscription:
            return Response(
                {'error': 'No active trial subscription found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Extend trial
        trial_subscription.extend_trial(additional_days)

        serializer = ClientSubscriptionSerializer(trial_subscription, context={'request': request})
        return Response({
            'message': f'Trial extended by {additional_days} days',
            'subscription': serializer.data
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_trial_status(request):
    """Get detailed trial status for current client"""
    try:
        client = request.user.client
        
        # Get current trial subscription
        trial_subscription = ClientSubscription.objects.filter(
            client=client,
            is_trial=True
        ).order_by('-created_at').first()
        
        if not trial_subscription:
            return Response({
                'has_trial': False,
                'message': 'No trial subscription found'
            })
        
        # Get current usage
        current_truck_count = Truck.objects.filter(client=client).count()
        
        response_data = {
            'has_trial': True,
            'status': trial_subscription.status,
            'is_active': trial_subscription.is_trial_active,
            'days_remaining': trial_subscription.trial_days_remaining,
            'trial_end_date': trial_subscription.trial_end_date,
            'plan': SubscriptionPlanSerializer(trial_subscription.plan, context={'request': request}).data,
            'current_usage': {
                'truck_count': current_truck_count,
                'truck_limit': trial_subscription.plan.truck_limit,
                'can_add_truck': trial_subscription.can_create_truck(current_truck_count)
            },
            'can_upgrade': trial_subscription.status == 'trial' and trial_subscription.is_trial_active
        }
        
        return Response(response_data)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )