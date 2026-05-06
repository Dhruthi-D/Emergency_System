from rest_framework import serializers

from .models import EmergencyService, Incident, IncidentImage, SensorData, TrafficSignal, Vehicle


class IncidentImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentImage
        fields = ("id", "image")


class IncidentSerializer(serializers.ModelSerializer):
    images = IncidentImageSerializer(many=True, read_only=True)

    class Meta:
        model = Incident
        fields = (
            "id",
            "type",
            "source",
            "description",
            "latitude",
            "longitude",
            "status",
            "created_by",
            "created_at",
            "updated_at",
            "images",
        )
        read_only_fields = ("source", "created_by")


class SensorAlertSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["accident", "fire", "gas"])
    value = serializers.FloatField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()


class SensorDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SensorData
        fields = "__all__"


class EmergencyServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyService
        fields = "__all__"


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = "__all__"


class TrafficSignalSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrafficSignal
        fields = "__all__"
