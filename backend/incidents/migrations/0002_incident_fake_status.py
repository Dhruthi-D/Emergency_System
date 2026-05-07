# Generated for incident fake/spam lifecycle support.

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("incidents", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="incident",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("dispatched", "Dispatched"),
                    ("in_progress", "In Progress"),
                    ("completed", "Completed"),
                    ("fake", "Fake"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
