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
import ssl
import smtplib
from email.message import EmailMessage
import logging

from base.models import Client
from base.subscription_models import SubscriptionPlan, ClientSubscription
from user.models import Profile, Role
from base.entry_data import email_sender, gmail_password

logger = logging.getLogger(__name__)


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
        # Updated for the actual token structure we're receiving
        required_fields = ['sub', 'iat', 'exp']
        
        # Check main fields
        for field in required_fields:
            if field not in payload:
                return False
        
        # The token should have either user object or direct user fields
        if 'user' in payload:
            user_data = payload.get('user', {})
            user_required_fields = ['id', 'client', 'name']
            for field in user_required_fields:
                if field not in user_data:
                    return False
        else:
            # Check for direct fields that we expect from Sovtes
            if 'client_id' not in payload or 'email' not in payload:
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
            client_id (str): Sovtes client ID
            client_name (str, optional): Client name for creation
            
        Returns:
            Client: The client instance
        """
        # Use Sovtes client ID as slug with prefix
        client_slug = f"sovtes-{client_id}"
        
        try:
            client = Client.objects.get(slug=client_slug)
            print(f"SOVTES CLIENT FOUND: {client.name} (ID: {client.id})")
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
            print(f"SOVTES CLIENT CREATED: {client.name} (ID: {client.id})")
            
            # Assign default subscription plan to new Sovtes clients
            SovtesUserManager._assign_default_subscription(client)
        
        return client
    
    @staticmethod
    def get_or_create_user(payload, client):
        """
        Gets or creates a user based on JWT payload data
        
        Args:
            payload (dict): JWT payload containing user data
            client (Client): Client instance
            
        Returns:
            tuple: (Profile, bool) - The user profile instance and created flag
        """
        # Extract user information from payload
        # Handle both nested user object and direct fields
        if 'user' in payload:
            user_data = payload['user']
            sovtes_user_id = user_data['id']
            user_email = user_data.get('email', f"sovtes_{sovtes_user_id}@sovtes-system.com")
            first_name = user_data.get('name', 'Sovtes User')
            last_name = user_data.get('surname', '')
        else:
            # Direct fields in payload - use 'sub' as the unique user identifier
            sovtes_user_id = payload.get('sub', 'unknown')
            user_email = payload.get('email', f"sovtes_{sovtes_user_id}@sovtes-system.com")
            first_name = payload.get('first_name', payload.get('name', 'Sovtes User'))
            last_name = payload.get('last_name', payload.get('surname', ''))
        
        # Generate unique username based on sovtes user ID
        username = f"sovtes_{sovtes_user_id}"
        
        try:
            user = Profile.objects.get(username=username)
            # Update client if it has changed
            updated = False
            if user.client != client:
                user.client = client
                updated = True

            # Promote existing Sovtes users to client_admin staff if not already
            if not user.is_staff or not user.is_superuser:
                user.is_staff = True
                user.is_superuser = True
                updated = True

            # Ensure role is client_admin (id 2) when possible
            try:
                client_admin_role = Role.objects.get(id=2)
                if user.role != client_admin_role:
                    user.role = client_admin_role
                    updated = True
            except Exception:
                # Fallback to role mapping if specific role id not found
                pass

            if updated:
                user.save()

            print(f"SOVTES USER FOUND: {username} ({user.email})")
            return user, False

        except Profile.DoesNotExist:
            # For Sovtes-created users, assign client_admin role (id 2) when possible
            try:
                role = Role.objects.get(id=2)
            except Exception:
                # Fallback to mapping logic if role with id=2 doesn't exist
                role = SovtesUserManager._get_user_role(payload)
            
            # Generate a secure temporary password (for emergency access only)
            temp_password = SovtesUserManager._generate_secure_password()
            
            # Create new user
            user = Profile.objects.create(
                username=username,
                email=user_email,
                first_name=first_name,
                last_name=last_name,
                client=client,
                role=role,
                is_active=True,
                is_staff=True,
                is_superuser=True,
                password=make_password(temp_password),  # Set secure temporary password
            )
            
            # Log the temporary password creation
            print(f"SOVTES USER CREATED: {username}")
            print(f"EMAIL: {user_email}")
            print(f"TEMPORARY PASSWORD: {temp_password}")
            print(f"CLIENT: {client.name}")
            print(f"IMPORTANT: This password is for emergency access only. User should authenticate via Sovtes JWT.")
            
            # Send welcome email with login credentials
            SovtesUserManager._send_welcome_email(user, temp_password, client)
            
            return user, True
    
    @staticmethod
    def _get_user_role(payload):
        """
        Determines appropriate role based on JWT payload
        
        Args:
            payload (dict): JWT payload
            
        Returns:
            Role: Appropriate role for the user
        """
        # Map user types to roles - check both nested and direct fields
        user_type = 1  # Default to regular user
        
        if 'user' in payload and 'usertype' in payload['user']:
            user_type = payload['user'].get('usertype', 1)
        elif 'usertype' in payload:
            user_type = payload.get('usertype', 1)
        elif 'role' in payload:
            user_type = payload.get('role', 1)
        
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
    def _send_welcome_email(user, temporary_password, client):
        """
        Send welcome email with login credentials to a new Sovtes user
        
        Args:
            user (Profile): The user profile
            temporary_password (str): The temporary password
            client (Client): The client instance
        """
        try:
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            
            subject = f'Welcome to Malog TMS - Login Credentials for {client.name}'
            
            body = f'''
Dear {user.get_full_name() or user.first_name},

Welcome to Malog TMS! Your account has been successfully created for {client.name}.

Your login credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Username: {user.username}
📧 Email: {user.email}
🔑 Temporary Password: {temporary_password}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Login URL: {frontend_url}/login

IMPORTANT SECURITY NOTES:
🔒 This password is for EMERGENCY ACCESS ONLY
🔑 You should primarily authenticate via your Sovtes JWT token
⚠️  Please keep these credentials secure and do not share them
📝 Store this password safely - you won't receive it again

Getting Started:
1. Visit {frontend_url}/main to access the application
2. Use your Sovtes system to authenticate (recommended)
3. Only use username/password for emergency access

If you have any questions or need assistance, please contact our support team.

Best regards,
The Malog TMS Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This email was sent automatically from Malog TMS.
Account created: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')} UTC
Client: {client.name}
            '''
            
            # Create email message
            email_message = EmailMessage()
            email_message['From'] = email_sender
            email_message['To'] = user.email
            email_message['Subject'] = subject
            email_message.set_content(body)

            # Send email using SMTP with STARTTLS
            context = ssl.create_default_context()
            with smtplib.SMTP('smtp.gmail.com', 587) as smtp:
                smtp.ehlo()
                smtp.starttls(context=context)
                smtp.ehlo()
                smtp.login(email_sender, gmail_password)
                smtp.send_message(email_message)
                
            logger.info(f"Welcome email sent to {user.email} for Sovtes user {user.username}")
            print(f"WELCOME EMAIL SENT: {user.email}")
            return True
            
        except Exception as e:
            logger.error(f'Failed to send welcome email to {user.email}: {str(e)}')
            print(f"FAILED TO SEND EMAIL: {user.email} - {str(e)}")
            return False
    
    @staticmethod
    def get_user_temp_password_info(user):
        """
        Get information about authentication for a Sovtes user
        
        Args:
            user (Profile): The user profile
            
        Returns:
            dict: Authentication information or None if not a Sovtes user
        """
        if not user.username.startswith('sovtes_'):
            return None
        
        has_password = bool(user.password) and user.has_usable_password()
        
        if has_password:
            auth_method = "JWT + Emergency Password"
            password_status = "Temporary password available"
            recommendation = "Use Sovtes JWT tokens. Password is for emergency access only."
            security_level = "Medium"
        else:
            auth_method = "JWT-only (Recommended)"
            password_status = "No password set"
            recommendation = "User should authenticate using JWT tokens from Sovtes"
            security_level = "High"
        
        return {
            'username': user.username,
            'email': user.email,
            'is_sovtes_user': True,
            'authentication_method': auth_method,
            'has_password': has_password,
            'password_status': password_status,
            'recommendation': recommendation,
            'security_level': security_level
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
            
            # Get subscription plan ID 4 for Sovtes clients (trial plan)
            try:
                trial_plan = SubscriptionPlan.objects.get(id=4, is_active=True)
            except SubscriptionPlan.DoesNotExist:
                # Fallback to base plan if ID 4 doesn't exist
                try:
                    trial_plan = SubscriptionPlan.objects.get(name='base', is_active=True)
                except SubscriptionPlan.DoesNotExist:
                    # If base plan doesn't exist, try to get any active plan
                    trial_plan = SubscriptionPlan.objects.filter(is_active=True).first()
                    if not trial_plan:
                        # No subscription plans available
                        return
            
            # Create subscription with trial status for Sovtes clients
            start_date = timezone.now()
            # Use the trial duration from the plan (defaults to 14 days)
            trial_duration = trial_plan.trial_duration_days if trial_plan.is_trial_plan else 14
            end_date = start_date + timedelta(days=trial_duration)
            
            ClientSubscription.objects.create(
                client=client,
                plan=trial_plan,
                billing_cycle='monthly',
                status='active',  # Sovtes clients get immediate active status
                start_date=start_date,
                end_date=end_date,
                trial_end_date=end_date,  # Set trial end date for trial subscriptions
                auto_renew=True,
                is_trial=True  # Assign as trial subscription for Sovtes clients
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


