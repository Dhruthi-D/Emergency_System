# Generated for temporary URL-only incident image storage.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("incidents", "0002_incident_fake_status"),
    ]

    operations = [
        migrations.RenameField(
            model_name="incidentimage",
            old_name="image",
            new_name="image_url",
        ),
        migrations.AlterField(
            model_name="incidentimage",
            name="image_url",
            field=models.URLField(max_length=1024),
        ),
    ]
