from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class RoleAwareTokenObtainPairSerializer(TokenObtainPairSerializer):
    role = serializers.ChoiceField(choices=[("recruiter","recruiter"), ("freelancer","freelancer")])

    def validate(self, attrs):
        data = super().validate(attrs)
        role = attrs.get("role")
        if self.user.role != role:
            raise serializers.ValidationError("Role mismatch for this account.")
        data["role"] = role
        data["user"] = {"id": self.user.id, "email": self.user.email, "username": self.user.username, "role": self.user.role}
        return data
