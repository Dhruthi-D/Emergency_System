import base64
import uuid

from django.core.files.base import ContentFile
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Incident, IncidentImage
from .realtime import broadcast_incident
from .serializers import IncidentSerializer


MAX_INCIDENT_IMAGES = 3


class IncidentViewSet(viewsets.ModelViewSet):
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Incident.objects.select_related("created_by").prefetch_related("images").order_by("-created_at")
        if getattr(self.request.user, "role", None) == "citizen":
            return queryset.filter(created_by=self.request.user)
        return queryset

    def _is_admin(self):
        return getattr(self.request.user, "role", None) == "admin"

    def _serializer_payload(self, incident):
        return IncidentSerializer(incident, context=self.get_serializer_context()).data

    def perform_create(self, serializer):
        source = "citizen" if self.request.user.role == "citizen" else "sensor"
        incident = serializer.save(created_by=self.request.user, source=source)
        image_data_list = self.request.data.get("captured_images", [])
        if not isinstance(image_data_list, list):
            raise ValidationError({"captured_images": "Expected a list of captured image data URLs."})
        for data_url in image_data_list[:MAX_INCIDENT_IMAGES]:
            if not isinstance(data_url, str) or ";base64," not in data_url:
                continue
            header, encoded = data_url.split(";base64,", 1)
            extension = "png" if "image/png" in header else "jpg"
            content = ContentFile(base64.b64decode(encoded), name=f"{uuid.uuid4().hex}.{extension}")
            IncidentImage.objects.create(incident=incident, image=content)
        broadcast_incident("new_incident", self._serializer_payload(incident))

    @action(detail=True, methods=["PATCH"], url_path="status")
    def update_status(self, request, pk=None):
        incident = self.get_object()
        next_status = request.data.get("status", incident.status)
        valid_statuses = {choice[0] for choice in Incident.STATUS_CHOICES}
        if next_status not in valid_statuses:
            raise ValidationError({"status": "Invalid incident status."})
        if next_status == "fake" and not self._is_admin():
            raise PermissionDenied("Only admin users can clear fake incidents.")
        incident.status = next_status
        incident.save(update_fields=["status", "updated_at"])
        payload = self._serializer_payload(incident)
        broadcast_incident("status_updated", payload)
        return Response(payload)

    @action(detail=True, methods=["PATCH"], url_path="mark_fake")
    def mark_fake(self, request, pk=None):
        if not self._is_admin():
            raise PermissionDenied("Only admin users can clear fake incidents.")
        incident = self.get_object()
        incident.status = "fake"
        incident.save(update_fields=["status", "updated_at"])
        payload = self._serializer_payload(incident)
        broadcast_incident("incident_marked_fake", payload)
        return Response(payload, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        if request.data.get("status") == "fake" and not self._is_admin():
            raise PermissionDenied("Only admin users can clear fake incidents.")
        response = super().partial_update(request, *args, **kwargs)
        broadcast_incident("status_updated", response.data)
        return response
