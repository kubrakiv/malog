"""
Onboarding API views for Malog TMS
Handles user onboarding workflow, status tracking, and tutorial completion
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from base.models import Truck, Trailer, Client
from user.models import DriverProfile


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def onboarding_status(request):
    """
    Check user's onboarding status and what steps are completed.
    Returns detailed information about client setup progress.
    
    Response includes:
    - needs_onboarding: Boolean indicating if onboarding is needed
    - is_new_client: Boolean indicating if this is a completely new client
    - completed_steps: List of completed onboarding steps
    - has_trucks, has_trailers, has_drivers: Individual step completion flags
    - is_onboarded: Client's onboarding completion status
    - planner_tutorial_shown: Whether planner tutorial was shown
    """
    user = request.user
    client = user.client
    
    if not client:
        return Response({
            'needs_onboarding': True,
            'completed_steps': [],
            'error': 'No client associated with user'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check what data exists for the client
    has_trucks = Truck.objects.filter(client=client).exists()
    has_trailers = Trailer.objects.filter(client=client).exists()
    has_drivers = DriverProfile.objects.filter(profile__client=client).exists()
    
    # Build completed steps list
    completed_steps = []
    if has_trucks:
        completed_steps.append('trucks')
    if has_trailers:
        completed_steps.append('trailers')
    if has_drivers:
        completed_steps.append('drivers')
    
    # Determine if new client (no data at all)
    is_new_client = not any([has_trucks, has_trailers, has_drivers])
    
    # User needs onboarding if:
    # 1. Client is not marked as onboarded AND
    # 2. They don't have essential data (trucks AND drivers)
    needs_onboarding = (not client.is_onboarded) and (not has_trucks or not has_drivers)
    
    return Response({
        'needs_onboarding': needs_onboarding,
        'is_new_client': is_new_client,
        'completed_steps': completed_steps,
        'has_trucks': has_trucks,
        'has_trailers': has_trailers,
        'has_drivers': has_drivers,
        'is_onboarded': client.is_onboarded,
        'planner_tutorial_shown': client.planner_tutorial_shown,
        'truck_count': Truck.objects.filter(client=client).count(),
        'trailer_count': Trailer.objects.filter(client=client).count(),
        'driver_count': DriverProfile.objects.filter(profile__client=client).count(),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_onboarding(request):
    """
    Mark onboarding as completed for the client.
    Validates that essential data (trucks and drivers) exists before allowing completion.
    
    Returns success/failure with appropriate messages.
    """
    user = request.user
    client = user.client
    
    if not client:
        return Response({
            'success': False,
            'message': 'No client associated with user'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get current onboarding status
    has_trucks = Truck.objects.filter(client=client).exists()
    has_drivers = DriverProfile.objects.filter(profile__client=client).exists()
    
    # Build list of missing required steps
    missing_steps = []
    if not has_trucks:
        missing_steps.append('trucks')
    if not has_drivers:
        missing_steps.append('drivers')
    
    # Check if essential requirements are met
    if missing_steps:
        return Response({
            'success': False,
            'message': 'Cannot complete onboarding - missing required data',
            'missing_steps': missing_steps,
            'details': {
                'trucks': 'Add at least one truck to your fleet',
                'drivers': 'Add at least one driver to your company'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Mark client as onboarded
    client.is_onboarded = True
    client.onboarded_at = timezone.now()
    client.save()
    
    return Response({
        'success': True,
        'message': 'Onboarding completed successfully! Welcome to MALOG Systems.',
        'onboarded_at': client.onboarded_at
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def skip_onboarding(request):
    """
    Allow users to skip onboarding wizard.
    Still marks as onboarded but with a flag that they skipped setup.
    """
    user = request.user
    client = user.client
    
    if not client:
        return Response({
            'success': False,
            'message': 'No client associated with user'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Mark as onboarded even if they skipped
    client.is_onboarded = True
    client.onboarded_at = timezone.now()
    
    # Store in settings that they skipped onboarding
    if not client.settings:
        client.settings = {}
    client.settings['onboarding_skipped'] = True
    client.settings['onboarding_skipped_at'] = timezone.now().isoformat()
    
    client.save()
    
    return Response({
        'success': True,
        'message': 'Onboarding skipped. You can access setup guide from Help menu anytime.',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_planner_tutorial(request):
    """
    Mark the planner tutorial as shown for the client.
    This prevents the tutorial from appearing again for users of this client.
    """
    user = request.user
    client = user.client
    
    if not client:
        return Response({
            'success': False,
            'message': 'No client associated with user'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    client.planner_tutorial_shown = True
    
    # Store additional tutorial completion data in settings
    if not client.settings:
        client.settings = {}
    client.settings['planner_tutorial_completed_at'] = timezone.now().isoformat()
    client.settings['planner_tutorial_completed_by'] = user.username
    
    client.save()
    
    return Response({
        'success': True,
        'message': 'Planner tutorial marked as completed'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_onboarding(request):
    """
    Reset onboarding status to allow re-running the wizard.
    Useful for testing or when client wants to review setup steps.
    """
    user = request.user
    client = user.client
    
    if not client:
        return Response({
            'success': False,
            'message': 'No client associated with user'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Reset onboarding flags
    client.is_onboarded = False
    client.onboarded_at = None
    client.planner_tutorial_shown = False
    
    # Clear onboarding-related settings
    if client.settings:
        client.settings.pop('onboarding_skipped', None)
        client.settings.pop('onboarding_skipped_at', None)
        client.settings.pop('planner_tutorial_completed_at', None)
        client.settings.pop('planner_tutorial_completed_by', None)
    
    client.save()
    
    return Response({
        'success': True,
        'message': 'Onboarding status reset. You can now run through the setup wizard again.'
    })
