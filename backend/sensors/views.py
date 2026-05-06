import math
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from incidents.models import Incident, SensorData
from incidents.realtime import broadcast_incident
from incidents.serializers import IncidentSerializer, SensorAlertSerializer

TYPE_TO_SENSOR = {"accident": "mpu6050", "gas": "mq2", "fire": "fire"}
DUPLICATE_RADIUS_KM = 0.35
DUPLICATE_WINDOW_MINUTES = 15


def haversine_km(lat1, lon1, lat2, lon2):
    earth_radius = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return 2 * earth_radius * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@api_view(["POST"])
@permission_classes([AllowAny])
def sensor_alert_view(request):
    serializer = SensorAlertSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    SensorData.objects.create(
        type=TYPE_TO_SENSOR[data["type"]],
        value=data["value"],
        latitude=data["latitude"],
        longitude=data["longitude"],
    )

    recent_sensor_incidents = Incident.objects.filter(
        source="sensor",
        type=data["type"],
        status__in=["pending", "dispatched", "in_progress"],
        created_at__gte=timezone.now() - timedelta(minutes=DUPLICATE_WINDOW_MINUTES),
    ).order_by("-created_at")[:30]

    for existing in recent_sensor_incidents:
        if (
            haversine_km(
                data["latitude"],
                data["longitude"],
                existing.latitude,
                existing.longitude,
            )
            <= DUPLICATE_RADIUS_KM
        ):
            payload = IncidentSerializer(existing).data
            return Response(
                {
                    "duplicate": True,
                    "detail": "Duplicate sensor alert suppressed for same active incident area.",
                    "incident": payload,
                },
                status=status.HTTP_200_OK,
            )

    incident = Incident.objects.create(
        type=data["type"],
        source="sensor",
        description=f"Sensor triggered {data['type']} alert with value {data['value']}",
        latitude=data["latitude"],
        longitude=data["longitude"],
    )
    payload = IncidentSerializer(incident).data
    broadcast_incident("new_incident", payload)
    return Response(payload, status=status.HTTP_201_CREATED)
