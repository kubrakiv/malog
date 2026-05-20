"""
Views for Sovtes JWT Authentication

This module contains the view functions for handling Sovtes JWT authentication.
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.exceptions import ValidationError
from django.conf import settings

from base.sovtes_auth import SovtesJWTValidator, SovtesUserManager
from user.serializers import UserSerializerWithToken


@api_view(['POST'])
@permission_classes([AllowAny])
def sovtes_jwt_login(request):
    """
    Handles JWT token authentication from Sovtes system
    
    Expected request body:
    {
        "token": "jwt_token_from_sovtes"
    }
    
    Returns:
        Response with user data and Malog JWT tokens on success
    """
    try:
        # Extract token from request
        token = request.data.get('jwt_token') or request.data.get('token')
        if not token:
            return Response(
                {'error': 'JWT token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate Sovtes JWT token
        try:
            payload = SovtesJWTValidator.validate_token(token)
        except ValidationError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Extract user and client data from payload
        # Handle both nested user object and direct fields
        if 'user' in payload:
            user_data = payload['user']
            client_id = user_data['client']
        else:
            # Direct fields in payload
            client_id = payload.get('client_id', payload.get('sub', 'unknown'))
            client_name = payload.get('client_name', f'Sovtes Client {client_id}')
        link_key = payload.get('tms_link_key') or payload.get('link_key')
        
        # Get or create client
        client = SovtesUserManager.get_or_create_client(
            client_id, 
            client_name=payload.get('client_name', f'Sovtes Client {client_id}'),
            link_key=link_key,
        )
        
        # Get or create user
        user, created = SovtesUserManager.get_or_create_user(payload, client)
        
        # Generate Malog JWT tokens for the user
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Add custom claims to access token
        access_token['username'] = user.username
        access_token['email'] = user.email
        
        # Get subscription information
        subscription_info = SovtesUserManager.get_client_subscription_info(client)
        
        # Prepare response data
        user_serializer = UserSerializerWithToken(user)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        
        response_data = {
            'message': 'Login successful',
            'user': user_serializer.data,
            'access': str(access_token),
            'refresh': str(refresh),
            'subscription': subscription_info,
            'redirect_url': f'{frontend_url}/main',  # Auto-redirect to main page
            'user_created': created,  # Indicate if this was a new user
            'sovtes_data': {
                'sovtes_user_id': payload.get('sub'),
                'sovtes_client_id': client_id,
                'tms_link_key': link_key,
                'user_type': payload.get('usertype'),
                'system_language': payload.get('systemlanguage')
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': f'Authentication failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_sovtes_token(request):
    """
    Verifies a Sovtes JWT token without creating a session
    
    Expected request body:
    {
        "token": "jwt_token_from_sovtes"
    }
    
    Returns:
        Response with token validity and decoded data
    """
    try:
        token = request.data.get('token')
        if not token:
            return Response(
                {'error': 'JWT token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            payload = SovtesJWTValidator.validate_token(token)
            return Response({
                'valid': True,
                'payload': payload,
                'message': 'Token is valid'
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({
                'valid': False,
                'error': str(e)
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    except Exception as e:
        return Response(
            {'error': f'Token verification failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )