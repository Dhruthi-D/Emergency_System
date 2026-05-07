# Generated to restore local folder-based incident image storage.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("incidents", "0003_incidentimage_url_storage"),
    ]

    operations = [
        migrations.RenameField(
            model_name="incidentimage",
            old_name="image_url",
            new_name="image",
        ),
        migrations.AlterField(
            model_name="incidentimage",
            name="image",
            field=models.ImageField(upload_to="incident_images/"),
        ),
    ]
