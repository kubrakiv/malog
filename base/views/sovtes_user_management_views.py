"""
Sovtes User Management Views for Admins
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError

from base.sovtes_auth import SovtesUserManager
from user.models import Profile
from user.views.user_views import AdminRolePermission


@api_view(['GET'])
@permission_classes([IsAuthenticated, AdminRolePermission])
def list_sovtes_users(request):
    """
    List all Sovtes users (Admin only)
    """
    try:
        sovtes_users = Profile.objects.filter(
            username__startswith='sovtes_'
        ).select_related('client', 'role').order_by('username')
        
        users_data = []
        for user in sovtes_users:
            user_info = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'client': {
                    'id': user.client.id if user.client else None,
                    'name': user.client.name if user.client else None,
                    'slug': user.client.slug if user.client else None,
                } if user.client else None,
                'role': {
                    'id': user.role.id if user.role else None,
                    'name': user.role.name if user.role else None,
                } if user.role else None,
                'is_active': user.is_active,
                'has_password': bool(user.password),
                'last_login': user.last_login,
                'date_joined': user.date_joined,
                'authentication_info': SovtesUserManager.get_user_temp_password_info(user)
            }
            users_data.append(user_info)
        
        return Response({
            'count': len(users_data),
            'users': users_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to list Sovtes users: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, AdminRolePermission])
def reset_sovtes_user_password(request, user_id):
    """
    Reset password for a Sovtes user (Admin only)
    """
    try:
        user = Profile.objects.get(id=user_id)
        
        if not user.username.startswith('sovtes_'):
            return Response(
                {'error': 'This endpoint is only for Sovtes users'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        new_password = SovtesUserManager.reset_sovtes_user_password(user)
        
        return Response({
            'message': f'Password reset for user {user.username}',
            'username': user.username,
            'temporary_password': new_password,
            'important_note': 'This password is for emergency access only. User should authenticate via Sovtes JWT tokens.'
        }, status=status.HTTP_200_OK)
        
    except Profile.DoesNotExist:
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except ValidationError as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to reset password: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, AdminRolePermission])
def disable_sovtes_user_password(request, user_id):
    """
    Disable password for a Sovtes user (Admin only)
    """
    try:
        user = Profile.objects.get(id=user_id)
        
        if not user.username.startswith('sovtes_'):
            return Response(
                {'error': 'This endpoint is only for Sovtes users'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_unusable_password()
        user.save()
        
        return Response({
            'message': f'Password disabled for user {user.username}',
            'username': user.username,
            'note': 'User can now only authenticate via Sovtes JWT tokens.'
        }, status=status.HTTP_200_OK)
        
    except Profile.DoesNotExist:
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to disable password: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, AdminRolePermission])
def sovtes_user_info(request, user_id):
    """
    Get detailed information about a Sovtes user (Admin only)
    """
    try:
        user = Profile.objects.get(id=user_id)
        
        if not user.username.startswith('sovtes_'):
            return Response(
                {'error': 'This endpoint is only for Sovtes users'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        auth_info = SovtesUserManager.get_user_temp_password_info(user)
        
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'client': {
                'id': user.client.id if user.client else None,
                'name': user.client.name if user.client else None,
                'slug': user.client.slug if user.client else None,
            } if user.client else None,
            'role': {
                'id': user.role.id if user.role else None,
                'name': user.role.name if user.role else None,
            } if user.role else None,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'has_password': bool(user.password),
            'last_login': user.last_login,
            'date_joined': user.date_joined,
            'authentication_info': auth_info
        }
        
        return Response(user_data, status=status.HTTP_200_OK)
        
    except Profile.DoesNotExist:
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to get user info: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )