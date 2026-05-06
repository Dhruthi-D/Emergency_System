from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def broadcast_incident(event_name, payload):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "incidents",
        {"type": "incident.message", "event": event_name, "payload": payload},
    )
