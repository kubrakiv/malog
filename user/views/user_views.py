from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_protect
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, BasePermission
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from user.models import Profile, Role, AdminProfile, LogistProfile, DriverProfile
from user.serializers import UserSerializer, UserSerializerWithToken, RoleSerializer

from django.contrib.auth.hashers import make_password
from rest_framework import status
import secrets
import string

from base.mailer import actions as mailer_actions
from base.models import Company
from user.models import UserSession


class AdminRolePermission(BasePermission):
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role_name = "admin"
        return request.user.role and request.user.role.name.lower() == role_name


class LogistRolePermission(BasePermission):
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role_name = "logist"
        return request.user.role and request.user.role.name.lower() == role_name


class DriverRolePermission(BasePermission):
	
	def has_permission(self, request, view):
		if not request.user or not request.user.is_authenticated:
			return False

		role_name = "driver"
		return request.user.role and request.user.role.name.lower() == role_name


class SystemAdminPermission(BasePermission):
    """
    Permission class for system administrators.
    System admins can manage the entire system, all clients, and approve new client registrations.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role_name = "system_admin"
        return request.user.role and request.user.role.name.lower() == role_name


class ClientAdminPermission(BasePermission):
    """
    Permission class for client administrators.
    Client admins can only manage users and data within their own client organization.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role_name = "client_admin"
        return (request.user.role and 
                request.user.role.name.lower() == role_name and 
                request.user.client is not None)


class AnyAdminPermission(BasePermission):
    """
    Permission class that allows both system admins and client admins.
    Use when both types of admins should have access.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        admin_roles = ["admin", "system_admin", "client_admin"]
        return (request.user.role and 
                request.user.role.name.lower() in admin_roles)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email

        return token
    
    def validate(self, attrs):
        from django.contrib.auth import authenticate
        from rest_framework import serializers
        
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            # Try to find the user first, regardless of is_active status
            try:
                from user.models import Profile
                user = Profile.objects.get(username=username)
                
                # Check if password is correct
                if not user.check_password(password):
                    raise serializers.ValidationError({
                        'detail': 'Unable to log in with provided credentials.'
                    })
                
                # Check if user's client exists and is not approved
                if user.client and not user.client.is_approved:
                    raise serializers.ValidationError({
                        'detail': 'Your account is pending approval. Please wait for admin approval.',
                        'approval_status': user.client.approval_status,
                        'error_code': 'ACCOUNT_PENDING'
                    })

                # Check if user is inactive but has an approved client
                if not user.is_active and user.client and user.client.is_approved:
                    raise serializers.ValidationError({
                        'detail': 'Your account has been deactivated. Please contact support.',
                        'error_code': 'ACCOUNT_DEACTIVATED'
                    })
                
                # If user is inactive and no client (shouldn't happen with our registration flow)
                if not user.is_active:
                    raise serializers.ValidationError({
                        'detail': 'Your account is pending approval. Please wait for admin approval.',
                        'error_code': 'ACCOUNT_PENDING'
                    })
                
                # User exists, password is correct, and account is active - proceed with normal flow
                self.user = user
                
            except Profile.DoesNotExist:
                # User doesn't exist
                raise serializers.ValidationError({
                    'detail': 'Unable to log in with provided credentials.'
                })
        else:
            raise serializers.ValidationError({
                'detail': 'Must include username and password.'
            })
        
        # Continue with token generation
        refresh = self.get_token(self.user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        
        serializer = UserSerializerWithToken(self.user).data
        for k, v in serializer.items():
            data[k] = v

        request = self.context.get('request')
        ip_address = None
        user_agent = None
        if request:
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            ip_address = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
            user_agent = (request.META.get('HTTP_USER_AGENT') or '')[:500] or None
        session = UserSession.objects.create(
            user=self.user,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        data['session_id'] = str(session.session_id)

        return data


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logoutUser(request):
    from django.utils import timezone
    session_id = request.data.get('session_id')
    if session_id:
        UserSession.objects.filter(
            session_id=session_id,
            user=request.user,
            logout_at__isnull=True,
        ).update(logout_at=timezone.now())
    return Response({'detail': 'Logged out'})


def _generate_temporary_password(length=16):
    characters = string.ascii_letters + string.digits + '!@#$%^&*'
    return ''.join(secrets.choice(characters) for _ in range(length))


def _get_manageable_users_queryset(user):
    if user.is_system_admin():
        return Profile.objects.all()
    if user.client:
        return Profile.objects.filter(client=user.client).exclude(role__name='system_admin')
    return Profile.objects.none()


@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Add authentication requirement
def registerUser(request):
	data = request.data

	role_name = data.get("role")
	print("role_name", role_name)
	role = Role.objects.filter(name=role_name).first()

	try:
		# Assign the same client as the requesting user
		user_client = request.user.client
		plain_password = data['password']

		profile = Profile.objects.create(
            role=role,
            client=user_client,  # Assign client
			first_name=data['first_name'],
            last_name=data['last_name'],
			username=data['email'],
			email=data['email'],
            phone_number=data['phone_number'],
			password=make_password(plain_password),
            registration_password=plain_password,
		)

		company = Company.all_objects.filter(client=user_client).first()
		mailer_actions.send_new_user_welcome(profile, plain_password, user_client, company)

		serializer = UserSerializerWithToken(profile, many=False)
		return Response(serializer.data)
	except:
		message = {'detail': 'Profile with this email already exists'}
		return Response(message, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateUserProfile(request):
    profile = request.user
    print("updateUserProfile", profile)
    data = request.data

    role_name = data.get("role")
    role = Role.objects.filter(name=role_name).first()
    
    profile.role = role
    profile.first_name = data['first_name']
    profile.last_name = data['last_name']
    profile.username = data['email']
    profile.email = data['email']
    profile.phone_number = data['phone_number']
    
    if data['password'] != '':
        profile.password = make_password(data['password'])

    profile.save()

    serializer = UserSerializerWithToken(profile, many=False)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([AnyAdminPermission])
def updateUser(request, pk): # this function is for User Edit Page
    data = request.data
    print("updateUser", data)

    role_name = data.get("role")
    role = Role.objects.filter(name=role_name).first()

    profile = _get_manageable_users_queryset(request.user).filter(id=pk).first()
    if not profile:
        return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    profile.role = role
    profile.first_name = data['first_name']
    profile.last_name = data['last_name']
    profile.username = data['email']
    profile.email = data['email']
    profile.phone_number = data['phone_number']
    
    profile.is_staff = data['is_admin']

    profile.save()

    serializer = UserSerializer(profile, many=False)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getUserProfile(request):
    profile = request.user
    serializer = UserSerializer(profile, many=False)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AnyAdminPermission])
def getUsers(request):
    profiles = _get_manageable_users_queryset(request.user)
    serializer = UserSerializer(profiles, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AnyAdminPermission])
def getUserById(request, pk):
    profile = _get_manageable_users_queryset(request.user).filter(id=pk).first()
    if not profile:
        return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = UserSerializer(profile, many=False)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([AnyAdminPermission])
def deleteUser(request, pk):
    profileForDeletion = _get_manageable_users_queryset(request.user).filter(id=pk).first()
    if not profileForDeletion:
        return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    profileForDeletion.delete()
    return Response('Profile was deleted')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getLogists(request):
    """Return all logist profiles belonging to the current client."""
    profiles = Profile.objects.filter(
        client=request.user.client,
        role__name='logist',
    ).select_related('logistprofile')
    data = []
    for p in profiles:
        logist = getattr(p, 'logistprofile', None)
        full_name = f"{p.first_name} {p.last_name}".strip() or p.username
        data.append({
            'id': p.id,
            'username': p.username,
            'full_name': full_name,
            'phone_number': logist.phone_number if logist else p.phone_number,
            'position': logist.position if logist else None,
        })
    return Response(data)


@api_view(['POST'])
@permission_classes([SystemAdminPermission])
def resetUserPassword(request, pk):
    profile = get_object_or_404(Profile, id=pk)

    new_password = _generate_temporary_password()
    profile.set_password(new_password)
    profile.save()

    return Response({
        'message': f'Password reset for user {profile.username}',
        'user_id': profile.id,
        'username': profile.username,
        'temporary_password': new_password,
        'registration_password': profile.registration_password,
    }, status=status.HTTP_200_OK)
