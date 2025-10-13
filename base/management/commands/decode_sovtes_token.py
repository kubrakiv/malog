"""
Management command to decode and analyze Sovtes JWT tokens
"""

from django.core.management.base import BaseCommand
from django.core.exceptions import ValidationError
import json
from base.sovtes_auth import SovtesJWTValidator


class Command(BaseCommand):
    help = 'Decode and analyze Sovtes JWT tokens'
    
    def add_arguments(self, parser):
        parser.add_argument(
            'token',
            type=str,
            help='The JWT token to decode'
        )
        parser.add_argument(
            '--validate',
            action='store_true',
            help='Validate the token (check expiration, etc.)'
        )
    
    def handle(self, *args, **options):
        token = options['token']
        should_validate = options['validate']
        
        self.stdout.write(
            self.style.SUCCESS(f'Analyzing JWT token...')
        )
        
        try:
            if should_validate:
                # Full validation
                payload = SovtesJWTValidator.validate_token(token)
                self.stdout.write(
                    self.style.SUCCESS('Token is valid!')
                )
            else:
                # Just decode without validation
                import jwt
                payload = jwt.decode(token, options={"verify_signature": False})
                self.stdout.write(
                    self.style.WARNING('Token decoded without validation!')
                )
            
            # Pretty print the payload
            self.stdout.write('\nToken Payload:')
            self.stdout.write('-' * 40)
            self.stdout.write(json.dumps(payload, indent=2))
            
            # Extract key information
            if 'user' in payload:
                user_data = payload['user']
                self.stdout.write('\nUser Information:')
                self.stdout.write('-' * 40)
                self.stdout.write(f"Sovtes User ID: {user_data.get('id')}")
                self.stdout.write(f"Client ID: {user_data.get('client')}")
                self.stdout.write(f"Name: {user_data.get('name')}")
                self.stdout.write(f"User Type: {user_data.get('usertype')}")
                self.stdout.write(f"System Language: {user_data.get('systemlanguage')}")
            
            # Token timing information
            if 'iat' in payload and 'exp' in payload:
                import datetime
                issued_at = datetime.datetime.fromtimestamp(payload['iat'])
                expires_at = datetime.datetime.fromtimestamp(payload['exp'])
                now = datetime.datetime.now()
                
                self.stdout.write('\nToken Timing:')
                self.stdout.write('-' * 40)
                self.stdout.write(f"Issued At: {issued_at}")
                self.stdout.write(f"Expires At: {expires_at}")
                self.stdout.write(f"Current Time: {now}")
                self.stdout.write(f"Is Expired: {'Yes' if now > expires_at else 'No'}")
                
                if now < expires_at:
                    time_remaining = expires_at - now
                    self.stdout.write(f"Time Remaining: {time_remaining}")
            
        except ValidationError as e:
            self.stdout.write(
                self.style.ERROR(f'Token validation failed: {e}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error analyzing token: {e}')
            )