"""
Sovtes JWT Authentication Module

This module handles JWT token authentication from the external Sovtes system.
It validates tokens, creates clients and users as needed, and provides session management.
"""

import jwt
import json
from datetime import datetime
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from datetime import timedelta
import secrets
import string

from base.models import Client
from base.subscription_models import SubscriptionPlan, ClientSubscription
from user.models import Profile, Role


# Sovtes public key for JWT verification (RSA512)
# In production, this should be stored securely, possibly in environment variables
SOVTES_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA...
-----END PUBLIC KEY-----"""

# For development/testing, we'll skip signature verification
# In production, set this to False and provide the actual public key
SKIP_SIGNATURE_VERIFICATION = True


class SovtesJWTValidator:
    """
    Validates Sovtes JWT tokens and extracts user information
    """
    
    @staticmethod
    def validate_token(token):
        """
        Validates a Sovtes JWT token and returns the decoded payload
        
        Args:
            token (str): The JWT token to validate
            
        Returns:
            dict: Decoded token payload if valid
            
        Raises:
            ValidationError: If token is invalid or expired
        """
        try:
            if SKIP_SIGNATURE_VERIFICATION:
                # For development - decode without verification
                decoded_token = jwt.decode(
                    token, 
                    options={"verify_signature": False, "verify_exp": True}
                )
            else:
                # Production - verify with Sovtes public key
                decoded_token = jwt.decode(
                    token,
                    SOVTES_PUBLIC_KEY,
                    algorithms=["RS512"],
                    options={"verify_exp": True}
                )
            
            # Validate token structure
            if not SovtesJWTValidator._validate_token_structure(decoded_token):
                raise ValidationError("Invalid token structure")
            
            return decoded_token
            
        except jwt.ExpiredSignatureError:
            raise ValidationError("Token has expired")
        except jwt.InvalidTokenError as e:
            raise ValidationError(f"Invalid token: {str(e)}")
        except Exception as e:
            raise ValidationError(f"Token validation failed: {str(e)}")
    
    @staticmethod
    def _validate_token_structure(payload):
        """
        Validates that the token has the expected Sovtes structure
        
        Args:
            payload (dict): Decoded JWT payload
            
        Returns:
            bool: True if structure is valid
        """
        required_fields = ['sub', 'iat', 'exp', 'user']
        user_required_fields = ['id', 'client', 'name']
        
        # Check main fields
        for field in required_fields:
            if field not in payload:
                return False
        
        # Check user object
        user_data = payload.get('user', {})
        for field in user_required_fields:
            if field not in user_data:
                return False
        
        return True


class SovtesUserManager:
    """
    Manages client and user creation/retrieval for Sovtes authentication
    """
    
    @staticmethod
    def get_or_create_client(client_id, client_name=None):
        """
        Gets or creates a client based on Sovtes client ID
        
        Args:
            client_id (int): Sovtes client ID
            client_name (str, optional): Client name for creation
            
        Returns:
            Client: The client instance
        """
        # Use Sovtes client ID as slug with prefix
        client_slug = f"sovtes-{client_id}"
        
        try:
            client = Client.objects.get(slug=client_slug)
        except Client.DoesNotExist:
            # Create new client
            client_name = client_name or f"Sovtes Client {client_id}"
            client = Client.objects.create(
                name=client_name,
                slug=client_slug,
                is_active=True,
                is_approved=True,  # Auto-approve Sovtes clients
                approval_status='approved'
            )
            
            # Assign default subscription plan to new Sovtes clients
            SovtesUserManager._assign_default_subscription(client)
        
        return client
    
    @staticmethod
    def get_or_create_user(user_data, client):
        """
        Gets or creates a user based on Sovtes user data
        
        Args:
            user_data (dict): User data from JWT token
            client (Client): Client instance
            
        Returns:
            Profile: The user profile instance
        """
        # Use Sovtes user ID as unique identifier
        sovtes_user_id = user_data['id']
        username = f"sovtes_{sovtes_user_id}"
        
        try:
            user = Profile.objects.get(username=username)
            # Update client if it has changed
            if user.client != client:
                user.client = client
                user.save()
        except Profile.DoesNotExist:
            # Get or create appropriate role
            role = SovtesUserManager._get_user_role(user_data)
            
            # Generate a secure temporary password (for emergency access only)
            temp_password = SovtesUserManager._generate_secure_password()
            
            # Create new user
            user = Profile.objects.create(
                username=username,
                email=f"sovtes_{sovtes_user_id}@sovtes-system.com",  # Placeholder email
                first_name=user_data.get('name', ''),
                client=client,
                role=role,
                is_active=True,
                password=make_password(temp_password),  # Set secure temporary password
                # Note: is_superuser and is_staff remain False by default
            )
            
            # Log the temporary password creation (in production, consider more secure logging)
            print(f"SOVTES USER CREATED: {username} with temporary password: {temp_password}")
            print(f"IMPORTANT: This password is for emergency access only. User should authenticate via Sovtes JWT.")
        
        return user
    
    @staticmethod
    def _get_user_role(user_data):
        """
        Determines appropriate role based on Sovtes user data
        
        Args:
            user_data (dict): User data from JWT token
            
        Returns:
            Role: Appropriate role for the user
        """
        # Map Sovtes user types to roles
        user_type = user_data.get('usertype', 1)
        
        role_mapping = {
            1: 'driver',      # Regular user
            2: 'admin',       # Admin user
            3: 'logist',      # Logist user
        }
        
        role_name = role_mapping.get(user_type, 'driver')
        
        # Get or create role
        role, created = Role.objects.get_or_create(name=role_name)
        
        return role
    
    @staticmethod
    def _generate_secure_password(length=16):
        """
        Generate a secure temporary password for Sovtes users
        
        Args:
            length (int): Password length (default: 16)
            
        Returns:
            str: Secure random password
        """
        # Use a mix of letters, digits, and safe special characters
        characters = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(characters) for _ in range(length))
        return password
    
    @staticmethod
    def get_user_temp_password_info(user):
        """
        Get information about temporary password for a Sovtes user
        
        Args:
            user (Profile): The user profile
            
        Returns:
            dict: Password information or None if not a Sovtes user
        """
        if not user.username.startswith('sovtes_'):
            return None
        
        return {
            'username': user.username,
            'is_sovtes_user': True,
            'authentication_method': 'JWT_ONLY',
            'has_password': bool(user.password),
            'note': 'This user should authenticate via Sovtes JWT tokens. Password is for emergency access only.'
        }
    
    @staticmethod
    def reset_sovtes_user_password(user):
        """
        Reset password for a Sovtes user (admin function)
        
        Args:
            user (Profile): The Sovtes user
            
        Returns:
            str: New temporary password
        """
        if not user.username.startswith('sovtes_'):
            raise ValidationError("This function is only for Sovtes users")
        
        new_password = SovtesUserManager._generate_secure_password()
        user.password = make_password(new_password)
        user.save()
        
        return new_password
    
    @staticmethod
    def _assign_default_subscription(client):
        """
        Assigns a default subscription plan to a new Sovtes client
        
        Args:
            client (Client): The client to assign subscription to
        """
        try:
            # Check if client already has an active subscription
            existing_subscription = ClientSubscription.objects.filter(
                client=client,
                status='active'
            ).exists()
            
            if existing_subscription:
                return  # Client already has a subscription
            
            # Get the base subscription plan (default for Sovtes clients)
            try:
                base_plan = SubscriptionPlan.objects.get(name='base', is_active=True)
            except SubscriptionPlan.DoesNotExist:
                # If base plan doesn't exist, try to get any active plan
                base_plan = SubscriptionPlan.objects.filter(is_active=True).first()
                if not base_plan:
                    # No subscription plans available
                    return
            
            # Create subscription with active status (Sovtes clients get immediate access)
            start_date = timezone.now()
            end_date = start_date + timedelta(days=30)  # Default to monthly billing
            
            ClientSubscription.objects.create(
                client=client,
                plan=base_plan,
                billing_cycle='monthly',
                status='active',  # Sovtes clients get immediate active status
                start_date=start_date,
                end_date=end_date,
                auto_renew=True,
                is_trial=False  # Consider as paid subscription from Sovtes
            )
            
        except Exception as e:
            # Log error but don't fail the client creation
            print(f"Warning: Failed to assign subscription to Sovtes client {client.name}: {str(e)}")
    
    @staticmethod
    def get_client_subscription_info(client):
        """
        Gets current subscription information for a client
        
        Args:
            client (Client): The client to get subscription info for
            
        Returns:
            dict: Subscription information or None if no active subscription
        """
        try:
            subscription = ClientSubscription.objects.get(
                client=client,
                status='active'
            )
            
            return {
                'plan_name': subscription.plan.name,
                'plan_display_name': subscription.plan.display_name,
                'billing_cycle': subscription.billing_cycle,
                'status': subscription.status,
                'start_date': subscription.start_date.isoformat(),
                'end_date': subscription.end_date.isoformat(),
                'truck_limit': subscription.plan.truck_limit,
                'features': subscription.plan.features,
                'auto_renew': subscription.auto_renew,
                'is_trial': subscription.is_trial
            }
        except ClientSubscription.DoesNotExist:
            return None


