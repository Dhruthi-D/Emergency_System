from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (("citizen", "Citizen"), ("admin", "Admin"))

    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="citizen")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "name"]

    def __str__(self):
        return f"{self.name} ({self.role})"
