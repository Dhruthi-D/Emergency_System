from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("incidents.urls")),
    path("api/", include("sensors.urls")),
    path("api/", include("admin_panel.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
