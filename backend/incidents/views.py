import base64
import uuid

from django.core.files.base import ContentFile
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Incident, IncidentImage
from .realtime import broadcast_incident
from .serializers import IncidentSerializer


class IncidentViewSet(viewsets.ModelViewSet):
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated]
    queryset = Incident.objects.all()

    def perform_create(self, serializer):
        source = "citizen" if self.request.user.role == "citizen" else "sensor"
        incident = serializer.save(created_by=self.request.user, source=source)
        image_data_list = self.request.data.get("captured_images", [])
        for data_url in image_data_list[:3]:
            if ";base64," not in data_url:
                continue
            _, encoded = data_url.split(";base64,", 1)
            content = ContentFile(base64.b64decode(encoded), name=f"{uuid.uuid4().hex}.jpg")
            IncidentImage.objects.create(incident=incident, image=content)
        broadcast_incident("new_incident", IncidentSerializer(incident).data)

    @action(detail=True, methods=["PATCH"], url_path="status")
    def update_status(self, request, pk=None):
        incident = self.get_object()
        incident.status = request.data.get("status", incident.status)
        incident.save(update_fields=["status", "updated_at"])
        payload = IncidentSerializer(incident).data
        broadcast_incident("status_updated", payload)
        return Response(payload)

    def partial_update(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        broadcast_incident("status_updated", response.data)
        return response
