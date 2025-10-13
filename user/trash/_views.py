# from django.shortcuts import render, get_object_or_404
# from django.views.decorators.csrf import csrf_protect
# from django.middleware.csrf import get_token
# from django.http import JsonResponse
# from django.db import transaction

# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated, IsAdminUser, BasePermission
# from rest_framework.response import Response
# from rest_framework import status

# from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
# from rest_framework_simplejwt.views import TokenObtainPairView
# from rest_framework_simplejwt.tokens import RefreshToken

# from .models import User, Role, AdminProfile, LogistProfile, DriverProfile
# from .serializers import UserSerializer, UserSerializerWithToken, RoleSerializer

# from django.contrib.auth.hashers import make_password
# from rest_framework import status


# class AdminRolePermission(BasePermission):
    
#     def has_permission(self, request, view):
#         if not request.user or not request.user.is_authenticated:
#             return False

#         role_name = "admin"
#         return  request.user.role.name == role_name


# class LogistRolePermission(BasePermission):
    
#     def has_permission(self, request, view):
#         if not request.user or not request.user.is_authenticated:
#             return False

#         role_name = "logist"
#         return  request.user.role.name == role_name


# class DriverRolePermission(BasePermission):
	
# 	def has_permission(self, request, view):
# 		if not request.user or not request.user.is_authenticated:
# 			return False

# 		role_name = "driver"
# 		return  request.user.role.name == role_name


# class MyTokenObtainPairSerializer(TokenObtainPairSerializer):

#     @classmethod
#     def get_token(cls, user):
#         token = super().get_token(user)

#         # Add custom claims
#         token['username'] = user.username
#         token['email'] = user.email

#         return token
    
#     def validate(self, attrs):
#         data = super().validate(attrs)
#         serializer = UserSerializerWithToken(self.user).data

#         for k, v in serializer.items():
#             data[k] = v 

#         return data


# class MyTokenObtainPairView(TokenObtainPairView):
#     serializer_class = MyTokenObtainPairSerializer


# # @permission_classes([IsAuthenticated])
# @api_view(['GET'])
# def getRoles(request):
#     roles = Role.objects.all()
#     serializer = RoleSerializer(roles, many=True)
#     return Response(serializer.data)


# @api_view(['POST'])
# def registerUser(request):
# 	data = request.data

# 	role_name = data.get("role")
# 	print("role_name", role_name)
# 	role = Role.objects.filter(name=role_name).first()

# 	try:
# 		user = User.objects.create(
#             role=role,
# 			first_name=data['first_name'],
#             last_name=data['last_name'],
# 			username=data['email'],
# 			email=data['email'],
#             phone_number=data['phone_number'],
# 			password=make_password(data['password'])
# 		)
# 		serializer = UserSerializerWithToken(user, many=False)
# 		return Response(serializer.data)
# 	except:
# 		message = {'detail': 'User with this email already exists'}
# 		return Response(message, status=status.HTTP_400_BAD_REQUEST)


# @api_view(['PUT'])
# @permission_classes([IsAuthenticated])
# def updateUserProfile(request):
#     user = request.user
#     print("updateUserProfile", user)
#     serializer = UserSerializerWithToken(user, many=False)
#     data = request.data

#     role_name = data.get("role")
#     role = Role.objects.filter(name=role_name).first()
    
#     user.role = role
#     user.first_name = data['first_name']
#     user.last_name = data['last_name']
#     user.username = data['email']
#     user.email = data['email']
#     user.phone_number = data['phone_number']
#     if data['password'] != '':
#         user.password = make_password(data['password'])

#     user.save()

#     return Response(serializer.data)


# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def getUserProfile(request):
#     user = request.user
#     serializer = UserSerializer(user, many=False)
#     return Response(serializer.data)


# @api_view(['GET'])
# @permission_classes([AdminRolePermission])
# def getUsers(request):
#     users = User.objects.all()
#     serializer = UserSerializer(users, many=True)
#     return Response(serializer.data)


# @api_view(['GET'])
# @permission_classes([AdminRolePermission])
# def getUserById(request, pk):
#     user = User.objects.get(id=pk)
#     serializer = UserSerializer(user, many=False)
#     return Response(serializer.data)


# @api_view(['PUT'])
# @permission_classes([AdminRolePermission])
# def updateUser(request, pk):
#     data = request.data
#     print("updateUser", data)

#     role_name = data.get("role")
#     role = Role.objects.filter(name=role_name).first()

#     # Manipulations with user profile data
#     user = User.objects.get(id=pk)

#     user.first_name = data['first_name']
#     user.last_name = data['last_name']
#     user.username = data['email']
#     user.email = data['email']
#     user.phone_number = data['phone_number']
#     user.role = role
#     user.is_staff = data['is_admin']

#     user.save()

#     serializer = UserSerializer(user, many=False)
#     return Response(serializer.data)


# @api_view(['DELETE'])
# @permission_classes([AdminRolePermission])
# def deleteUser(request, pk):
#     userForDeletion = User.objects.get(id=pk)
#     userForDeletion.delete()
#     return Response('User was deleted')
