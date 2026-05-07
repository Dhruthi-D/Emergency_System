from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def _incident_groups_for_payload(payload):
    groups = {"incidents_admins"}
    created_by = payload.get("created_by") if isinstance(payload, dict) else None
    if created_by:
        groups.add(f"incidents_user_{created_by}")
    return groups


def broadcast_incident(event_name, payload):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    message = {"type": "incident.message", "event": event_name, "payload": payload}
    for group_name in _incident_groups_for_payload(payload):
        async_to_sync(channel_layer.group_send)(group_name, message)
