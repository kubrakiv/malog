"""
Sovtes Redirect Views

Handles redirecting users after successful JWT authentication from Sovtes.
"""

from django.shortcuts import redirect
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
import json

from base.sovtes_auth import SovtesJWTValidator, SovtesUserManager
from rest_framework_simplejwt.tokens import RefreshToken


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def sovtes_redirect_auth(request):
    """
    Handles JWT authentication from Sovtes and redirects to main page
    
    This endpoint can handle both GET and POST requests:
    - GET: Token passed as query parameter
    - POST: Token passed in request body
    
    After successful authentication, it redirects to the main page with auth tokens
    """
    try:
        # Extract token from request
        if request.method == 'GET':
            token = request.GET.get('token') or request.GET.get('jwt_token')
        else:
            token = request.data.get('jwt_token') or request.data.get('token')
            
        if not token:
            return _redirect_with_error('JWT token is required')
        
        # Validate Sovtes JWT token
        try:
            payload = SovtesJWTValidator.validate_token(token)
        except ValidationError as e:
            return _redirect_with_error(f'Invalid token: {str(e)}')
        
        # Extract client data from payload
        if 'user' in payload:
            user_data = payload['user']
            client_id = user_data['client']
        else:
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
        
        # Get frontend URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        
        # Create redirect URL with tokens as query parameters
        redirect_url = f"{frontend_url}/main?access_token={str(access_token)}&refresh_token={str(refresh)}&sovtes_auth=true"
        
        if created:
            redirect_url += "&new_user=true"
        
        # Log successful authentication
        print(f"SOVTES AUTH SUCCESS: Redirecting {user.username} to {redirect_url}")
        
        # Return redirect response
        if request.method == 'GET':
            return redirect(redirect_url)
        else:
            return Response({
                'message': 'Authentication successful',
                'redirect_url': redirect_url,
                'user_created': created
            }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return _redirect_with_error(f'Authentication failed: {str(e)}')


def _redirect_with_error(error_message):
    """
    Helper function to redirect to frontend with error message
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    error_url = f"{frontend_url}/login?error={error_message}"
    return redirect(error_url)


@api_view(['GET'])
@permission_classes([AllowAny])
def sovtes_auth_status(request):
    """
    Check authentication status endpoint for debugging
    """
    return Response({
        'message': 'Sovtes authentication endpoint is active',
        'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
        'endpoints': {
            'login': '/api/sovtes-auth/login/',
            'redirect': '/api/sovtes-auth/redirect/',
            'verify': '/api/sovtes-auth/verify/'
        }
    }, status=status.HTTP_200_OK)