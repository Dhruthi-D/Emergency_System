from django.db.models import Count
from django.shortcuts import get_object_or_404
import requests
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from incidents.models import Incident, TrafficSignal, Vehicle
from incidents.realtime import broadcast_incident
from incidents.serializers import IncidentSerializer

from .routing_utils import haversine_km

OSRM_BASE = "https://router.project-osrm.org"
OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
HTTP_HEADERS = {
    "User-Agent": "smart-city-emergency-system/1.0",
    "Accept": "application/json",
}
BENGALURU_CENTER = {"lat": 12.9716, "lng": 77.5946}
BENGALURU_FALLBACK_RADIUS_M = 25000


def is_admin_user(request):
    return getattr(request.user, "role", None) == "admin"


def admin_required_response(request):
    if is_admin_user(request):
        return None
    return Response({"detail": "Admin access is required."}, status=status.HTTP_403_FORBIDDEN)


def service_types_for_incident(incident_type):
    if incident_type == "health":
        return ["hospital"]
    if incident_type in {"fire", "gas"}:
        return ["fire_station"]
    if incident_type == "accident":
        return ["hospital", "fire_station"]
    return ["police"]


def osrm_route(start_lat, start_lng, end_lat, end_lng):
    url = (
        f"{OSRM_BASE}/route/v1/driving/"
        f"{start_lng},{start_lat};{end_lng},{end_lat}"
        "?overview=full&geometries=geojson"
    )
    response = requests.get(url, timeout=8, headers=HTTP_HEADERS)
    response.raise_for_status()
    data = response.json()
    coords = data["routes"][0]["geometry"]["coordinates"]
    return [{"lat": lat, "lng": lng} for lng, lat in coords]


def fetch_osm_services(lat, lng, incident_type, radius_m=4500, limit=6):
    service_types = service_types_for_incident(incident_type)
    elements = []
    radii = [radius_m, 9000, 15000]
    search_points = [
        (lat, lng),
        (BENGALURU_CENTER["lat"], BENGALURU_CENTER["lng"]),
    ]

    for search_lat, search_lng in search_points:
        for current_radius in radii:
            overpass_selectors = []
            for service_type in service_types:
                if service_type == "hospital":
                    # Include both amenity and healthcare tagging styles.
                    overpass_selectors.extend(
                        [
                            f'node["amenity"="hospital"](around:{current_radius},{search_lat},{search_lng});',
                            f'way["amenity"="hospital"](around:{current_radius},{search_lat},{search_lng});',
                            f'node["healthcare"="hospital"](around:{current_radius},{search_lat},{search_lng});',
                        ]
                    )
                elif service_type == "fire_station":
                    overpass_selectors.extend(
                        [
                            f'node["amenity"="fire_station"](around:{current_radius},{search_lat},{search_lng});',
                            f'way["amenity"="fire_station"](around:{current_radius},{search_lat},{search_lng});',
                        ]
                    )
                elif service_type == "police":
                    overpass_selectors.extend(
                        [
                            f'node["amenity"="police"](around:{current_radius},{search_lat},{search_lng});',
                            f'way["amenity"="police"](around:{current_radius},{search_lat},{search_lng});',
                        ]
                    )
            query = f"[out:json][timeout:18];({''.join(overpass_selectors)});out center;"
            for endpoint in OVERPASS_ENDPOINTS:
                try:
                    response = requests.post(
                        endpoint,
                        data={"data": query},
                        timeout=20,
                        headers=HTTP_HEADERS,
                    )
                    response.raise_for_status()
                    elements = response.json().get("elements", [])
                    if elements:
                        break
                except Exception:
                    continue
            if elements:
                break
        if elements:
            break
    if not elements:
        return []

    services = []
    for idx, element in enumerate(elements):
        tags = element.get("tags", {})
        element_lat = element.get("lat")
        element_lng = element.get("lon")
        if element_lat is None or element_lng is None:
            center = element.get("center", {})
            element_lat = center.get("lat")
            element_lng = center.get("lon")
        raw_name = tags.get("name", "") or ""
        service = {
            "id": f"osm-{element.get('id', idx)}",
            "name": raw_name or tags.get("amenity", "Service").replace("_", " ").title(),
            "type": tags.get("amenity", tags.get("healthcare", "service")),
            "latitude": element_lat,
            "longitude": element_lng,
        }
        if service["latitude"] is None or service["longitude"] is None:
            continue
        # For hospital lookups, only include entries that clearly look like hospitals.
        # This intentionally excludes clinics/therapy centers per project requirement.
        if service["type"] == "hospital":
            name_l = (service["name"] or "").lower()
            if "hospital" not in name_l:
                continue
            if any(bad in name_l for bad in ["clinic", "therapy", "physio", "physiotherapy", "diagnostic", "lab", "centre", "center"]):
                continue
        services.append(service)

    services.sort(
        key=lambda s: haversine_km(
            lat,
            lng,
            s["latitude"],
            s["longitude"],
        )
    )
    return services[:limit]


@api_view(["GET"])
def dashboard_view(request):
    denied = admin_required_response(request)
    if denied:
        return denied
    incidents = Incident.objects.select_related("created_by").prefetch_related("images").all()[:100]
    counts = Incident.objects.values("status").annotate(total=Count("id"))
    return Response(
        {
            "incidents": IncidentSerializer(incidents, many=True, context={"request": request}).data,
            "services": [],
            "junctions": [],
            "status_counts": list(counts),
        }
    )


@api_view(["GET"])
def nearby_services_view(request):
    denied = admin_required_response(request)
    if denied:
        return denied
    incident_id = request.query_params.get("incident_id")
    if not incident_id:
        return Response({"detail": "incident_id is required"}, status=status.HTTP_400_BAD_REQUEST)
    incident = get_object_or_404(Incident, id=incident_id)
    if incident.status == "fake":
        return Response({"detail": "Cleared incidents do not need responder lookup."}, status=status.HTTP_400_BAD_REQUEST)
    ranked = fetch_osm_services(incident.latitude, incident.longitude, incident.type, limit=3)
    nearest_service = ranked[0] if ranked else None
    route = []
    if nearest_service:
        try:
            route = osrm_route(
                nearest_service["latitude"],
                nearest_service["longitude"],
                incident.latitude,
                incident.longitude,
            )
        except Exception:
            route = []
    return Response(
        {
            "incident_id": incident.id,
            "incident_type": incident.type,
            "nearby_services": ranked,
            "route_preview": route,
        }
    )


@api_view(["POST"])
def dispatch_view(request):
    denied = admin_required_response(request)
    if denied:
        return denied
    incident_id = request.data.get("incident_id")
    vehicle_count = int(request.data.get("vehicle_count", 1))
    incident = get_object_or_404(Incident, id=incident_id)
    if incident.status == "fake":
        return Response({"detail": "Cleared incidents cannot be dispatched."}, status=status.HTTP_400_BAD_REQUEST)
    if incident.status == "completed":
        return Response({"detail": "Completed incidents cannot be dispatched again."}, status=status.HTTP_400_BAD_REQUEST)
    services = fetch_osm_services(incident.latitude, incident.longitude, incident.type, limit=3)
    if not services:
        # Final broad pass across Bengaluru before failing.
        services = fetch_osm_services(
            BENGALURU_CENTER["lat"],
            BENGALURU_CENTER["lng"],
            incident.type,
            radius_m=BENGALURU_FALLBACK_RADIUS_M,
            limit=3,
        )
    if not services:
        return Response({"detail": "Unable to fetch emergency services from OSM providers."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    nearest_service = services[0]
    route = osrm_route(
        nearest_service["latitude"],
        nearest_service["longitude"],
        incident.latitude,
        incident.longitude,
    )

    vehicles = []
    for i in range(vehicle_count):
        vehicle = Vehicle.objects.create(
            type=request.data.get("vehicle_type", "ambulance"),
            status="dispatched",
            current_location=route[0],
        )
        vehicles.append({"id": vehicle.id, "type": vehicle.type})

    incident.status = "dispatched"
    incident.save(update_fields=["status", "updated_at"])
    broadcast_incident("status_updated", IncidentSerializer(incident, context={"request": request}).data)

    signal_state = []
    for idx, point in enumerate(route[::8]):
        dist = haversine_km(point["lat"], point["lng"], incident.latitude, incident.longitude)
        signal = TrafficSignal.objects.create(
            latitude=point["lat"],
            longitude=point["lng"],
            status="green" if dist < 1 else "red",
            controlled_by_system=True,
        )
        signal_state.append({"id": signal.id, "lat": signal.latitude, "lng": signal.longitude, "status": signal.status})
        if idx > 15:
            break

    return Response(
        {
            "incident_id": incident.id,
            "service": {
                "id": nearest_service["id"],
                "name": nearest_service["name"],
                "type": nearest_service["type"],
                "latitude": nearest_service["latitude"],
                "longitude": nearest_service["longitude"],
            },
            "nearby_services": services,
            "vehicles": vehicles,
            "route": route,
            "traffic_signals": signal_state,
        },
        status=status.HTTP_200_OK,
    )
