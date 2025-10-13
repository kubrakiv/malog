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
        data = super().validate(attrs)
        
        # Check if user's client is approved
        if self.user.client and not self.user.client.is_approved:
            from rest_framework import serializers
            raise serializers.ValidationError({
                'detail': 'Your account is pending approval. Please wait for admin approval.',
                'approval_status': self.user.client.approval_status
            })
        
        serializer = UserSerializerWithToken(self.user).data

        for k, v in serializer.items():
            data[k] = v 

        return data


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


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
		
		profile = Profile.objects.create(
            role=role,
            client=user_client,  # Assign client
			first_name=data['first_name'],
            last_name=data['last_name'],
			username=data['email'],
			email=data['email'],
            phone_number=data['phone_number'],
			password=make_password(data['password'])
		)
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
@permission_classes([AdminRolePermission])
def updateUser(request, pk): # this function is for User Edit Page
    data = request.data
    print("updateUser", data)

    role_name = data.get("role")
    role = Role.objects.filter(name=role_name).first()

    # Only allow updating users from the same client
    user_client = request.user.client
    if user_client:
        profile = Profile.objects.filter(client=user_client, id=pk).first()
        if not profile:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response({'detail': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

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
@permission_classes([AdminRolePermission])
def getUsers(request):
    # Only show users from the same client
    user_client = request.user.client
    if user_client:
        profiles = Profile.objects.filter(client=user_client)
    else:
        profiles = Profile.objects.none()  # Return empty queryset if no client
    serializer = UserSerializer(profiles, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AdminRolePermission])
def getUserById(request, pk):
    # Only allow access to users from the same client
    user_client = request.user.client
    if user_client:
        profile = Profile.objects.filter(client=user_client, id=pk).first()
        if not profile:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response({'detail': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = UserSerializer(profile, many=False)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([AdminRolePermission])
def deleteUser(request, pk):
    # Only allow deleting users from the same client
    user_client = request.user.client
    if user_client:
        profileForDeletion = Profile.objects.filter(client=user_client, id=pk).first()
        if not profileForDeletion:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response({'detail': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    
    profileForDeletion.delete()
    return Response('Profile was deleted')
