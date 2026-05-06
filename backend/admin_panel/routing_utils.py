import math

from incidents.models import EmergencyService

BENGALURU_JUNCTIONS = [
    {"name": "Majestic", "lat": 12.9763, "lng": 77.5713},
    {"name": "Mekhri Circle", "lat": 13.0172, "lng": 77.5800},
    {"name": "Hebbal", "lat": 13.0352, "lng": 77.5970},
    {"name": "Silk Board", "lat": 12.9171, "lng": 77.6229},
    {"name": "KR Puram", "lat": 13.0088, "lng": 77.6960},
    {"name": "Marathahalli", "lat": 12.9591, "lng": 77.6974},
    {"name": "Banashankari", "lat": 12.9250, "lng": 77.5468},
    {"name": "Electronic City", "lat": 12.8456, "lng": 77.6603},
]

DEFAULT_SERVICES = [
    ("City Hospital", "hospital", 12.9352, 77.6245),
    ("Metro Fire Station", "fire_station", 12.9712, 77.5943),
    ("Central Police HQ", "police", 12.9795, 77.5913),
    ("Whitefield Hospital", "hospital", 12.9698, 77.7499),
    ("Yelahanka Police", "police", 13.1007, 77.5963),
]


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def ensure_default_services():
    if EmergencyService.objects.exists():
        return
    for name, service_type, lat, lng in DEFAULT_SERVICES:
        EmergencyService.objects.create(name=name, type=service_type, latitude=lat, longitude=lng)


def nearest_point(lat, lng, points):
    best = None
    best_dist = float("inf")
    for point in points:
        d = haversine_km(lat, lng, point["lat"], point["lng"])
        if d < best_dist:
            best_dist = d
            best = point
    return best, best_dist


def interpolate_segment(start, end, steps=8, curve_bias=0.0006):
    points = []
    for i in range(steps + 1):
        t = i / steps
        lat = start["lat"] + (end["lat"] - start["lat"]) * t
        lng = start["lng"] + (end["lng"] - start["lng"]) * t
        # Slight sinusoidal offset for road-like curvature.
        lat += math.sin(t * math.pi) * curve_bias
        lng += math.cos(t * math.pi) * curve_bias * 0.5
        points.append({"lat": lat, "lng": lng})
    return points


def generate_simulated_route(service, incident):
    start = {"lat": service.latitude, "lng": service.longitude}
    end = {"lat": incident.latitude, "lng": incident.longitude}
    near_start, _ = nearest_point(start["lat"], start["lng"], BENGALURU_JUNCTIONS)
    near_end, _ = nearest_point(end["lat"], end["lng"], BENGALURU_JUNCTIONS)

    intermediates = sorted(
        BENGALURU_JUNCTIONS,
        key=lambda p: haversine_km(p["lat"], p["lng"], (near_start["lat"] + near_end["lat"]) / 2, (near_start["lng"] + near_end["lng"]) / 2),
    )[:2]

    waypoints = [start, near_start] + intermediates + [near_end, end]
    route = []
    for idx in range(len(waypoints) - 1):
        segment = interpolate_segment(waypoints[idx], waypoints[idx + 1], steps=10)
        route.extend(segment[1:] if route else segment)
    return route
