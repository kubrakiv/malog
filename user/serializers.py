import base64
import uuid

from django.core.files.base import ContentFile
from rest_framework import serializers
from .models import Profile, Role, DriverProfile
from rest_framework_simplejwt.tokens import RefreshToken


class TruckField(serializers.RelatedField):
    def to_representation(self, value):
        return {'id': value.id, 'plates': value.plates}


class Base64ImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if isinstance(data, str) and data.startswith('data:'):
            header, imgstr = data.split(';base64,', 1)
            ext = header.split('/')[-1]
            data = ContentFile(base64.b64decode(imgstr), name=f"{uuid.uuid4()}.{ext}")
        return super().to_internal_value(data)


class DriverProfileSerializer(serializers.ModelSerializer):
    trucks = TruckField(many=True, read_only=True)
    image = Base64ImageField(required=False, allow_null=True)

    class Meta:
        model = DriverProfile
        fields = ["profile", "first_name", "last_name", "middle_name", "full_name", "email", "phone_number", "position", "license_series", "license_number", "birth_date", "started_work", "finished_work", "country", "image", "trucks", "sovtes_id"]



class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField(read_only=True)
    is_admin = serializers.SerializerMethodField(read_only=True)
    role = serializers.SerializerMethodField(read_only=True)
    client = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'is_admin', 'role', 'phone_number', 'client', 'is_staff', 'is_superuser']

    def get_full_name(self, obj):
        full_name = obj.first_name + " " + obj.last_name
        if full_name == " ":
            full_name = obj.email
        return full_name
    
    def get_is_admin(self, obj):
        return obj.is_staff

    def get_role(self, obj):
        return obj.role.name if obj.role else None
    
    def get_client(self, obj):
        if obj.client:
            return {
                'id': obj.client.id,
                'name': obj.client.name,
                'slug': obj.client.slug,
                'is_active': obj.client.is_active,
                'approval_status': obj.client.approval_status
            }
        return None


class UserSerializerWithToken(UserSerializer):
    token = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'username', 'email', 'phone_number', 'full_name', 'is_admin', 'role', 'token']

    def get_token(self, obj):
        token = RefreshToken.for_user(obj) 
        return str(token.access_token)


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

      