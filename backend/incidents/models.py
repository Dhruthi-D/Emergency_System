from django.conf import settings
from django.db import models


class Incident(models.Model):
    TYPE_CHOICES = (
        ("accident", "Accident"),
        ("fire", "Fire"),
        ("gas", "Gas Leak"),
        ("health", "Health Emergency"),
    )
    SOURCE_CHOICES = (("sensor", "Sensor"), ("citizen", "Citizen"))
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("dispatched", "Dispatched"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    )

    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    description = models.TextField(blank=True, default="")
    latitude = models.FloatField()
    longitude = models.FloatField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="incidents"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class IncidentImage(models.Model):
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="incident_images/")


class SensorData(models.Model):
    SENSOR_CHOICES = (
        ("mpu6050", "MPU6050"),
        ("mq2", "MQ2"),
        ("fire", "Fire"),
        ("dht", "DHT"),
    )
    type = models.CharField(max_length=20, choices=SENSOR_CHOICES)
    value = models.FloatField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)


class EmergencyService(models.Model):
    SERVICE_CHOICES = (
        ("hospital", "Hospital"),
        ("fire_station", "Fire Station"),
        ("police", "Police"),
    )
    name = models.CharField(max_length=120)
    type = models.CharField(max_length=30, choices=SERVICE_CHOICES)
    latitude = models.FloatField()
    longitude = models.FloatField()


class Vehicle(models.Model):
    VEHICLE_CHOICES = (
        ("ambulance", "Ambulance"),
        ("fire_truck", "Fire Truck"),
        ("police_vehicle", "Police Vehicle"),
    )
    type = models.CharField(max_length=30, choices=VEHICLE_CHOICES)
    status = models.CharField(max_length=50, default="available")
    current_location = models.JSONField(default=dict)


class TrafficSignal(models.Model):
    SIGNAL_CHOICES = (("red", "Red"), ("green", "Green"))
    latitude = models.FloatField()
    longitude = models.FloatField()
    status = models.CharField(max_length=10, choices=SIGNAL_CHOICES, default="red")
    controlled_by_system = models.BooleanField(default=True)
