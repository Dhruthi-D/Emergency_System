from rest_framework import serializers

from .models import EmergencyService, Incident, IncidentImage, SensorData, TrafficSignal, Vehicle


class IncidentImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = IncidentImage
        fields = ("id", "image", "image_url")

    def get_image_url(self, obj):
        if not obj.image:
            return ""
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


class IncidentSerializer(serializers.ModelSerializer):
    images = IncidentImageSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)
    reporter_name = serializers.SerializerMethodField()

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
            "created_by_name",
            "reporter_name",
            "created_at",
            "updated_at",
            "images",
        )
        read_only_fields = ("source", "created_by")

    def get_reporter_name(self, obj):
        if obj.source == "sensor":
            return "Sensor Alert"
        return getattr(obj.created_by, "name", "") or "Unknown Reporter"


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
