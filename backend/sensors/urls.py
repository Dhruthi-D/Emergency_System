from django.urls import path

from .views import sensor_alert_view

urlpatterns = [
    path("sensor-alert/", sensor_alert_view),
]
