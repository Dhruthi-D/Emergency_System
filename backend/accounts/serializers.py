from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "name", "email", "password", "role")

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User(
            username=validated_data["email"],
            email=validated_data["email"],
            name=validated_data["name"],
            role=validated_data.get("role", "citizen"),
        )
        user.set_password(validated_data["password"])
        user.save()
        return user
