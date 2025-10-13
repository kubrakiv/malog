from rest_framework import serializers
from .models import Profile, Role, DriverProfile
from rest_framework_simplejwt.tokens import RefreshToken


class TruckField(serializers.RelatedField):
    def to_representation(self, value):
        return {'id': value.id, 'plates': value.plates}


class DriverProfileSerializer(serializers.ModelSerializer):
    trucks = TruckField(many=True, read_only=True)
    
    class Meta:
        model = DriverProfile
        fields = ["profile", "first_name", "last_name", "middle_name", "full_name", "email", "phone_number", "position", "license_series", "license_number", "birth_date", "started_work", "finished_work", "country", "image", "trucks"]



class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField(read_only=True)
    is_admin = serializers.SerializerMethodField(read_only=True)
    role = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'is_admin', 'role', 'phone_number']

    def get_full_name(self, obj):
        full_name = obj.first_name + " " + obj.last_name
        if full_name == " ":
            full_name = obj.email
        return full_name
    
    def get_is_admin(self, obj):
        return obj.is_staff

    def get_role(self, obj):
        return obj.role.name.lower() if obj.role else None


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

      