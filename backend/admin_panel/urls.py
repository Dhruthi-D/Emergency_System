from django.urls import path

from .views import dashboard_view, dispatch_view, nearby_services_view

urlpatterns = [
    path("dashboard/", dashboard_view),
    path("nearby-services/", nearby_services_view),
    path("dispatch/", dispatch_view),
]
