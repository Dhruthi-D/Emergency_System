import json
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def get_user_from_token(token):
    User = get_user_model()
    try:
        access_token = AccessToken(token)
        user_id = access_token.get("user_id")
        if not user_id:
            return None
        return User.objects.get(id=user_id)
    except (TokenError, User.DoesNotExist):
        return None


class IncidentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.groups_to_discard = []
        user = await self.resolve_user()
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return

        if getattr(user, "role", None) == "admin":
            self.groups_to_discard = ["incidents_admins"]
        elif getattr(user, "role", None) == "citizen":
            self.groups_to_discard = [f"incidents_user_{user.id}"]
        else:
            await self.close(code=4403)
            return

        for group_name in self.groups_to_discard:
            await self.channel_layer.group_add(group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        for group_name in getattr(self, "groups_to_discard", []):
            await self.channel_layer.group_discard(group_name, self.channel_name)

    async def incident_message(self, event):
        await self.send(text_data=json.dumps({"event": event["event"], "payload": event["payload"]}))

    async def resolve_user(self):
        scope_user = self.scope.get("user")
        if scope_user and scope_user.is_authenticated:
            return scope_user

        query_string = self.scope.get("query_string", b"").decode()
        token = parse_qs(query_string).get("token", [None])[0]
        if not token:
            return None
        return await get_user_from_token(token)
