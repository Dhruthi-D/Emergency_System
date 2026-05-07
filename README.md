# Smart Emergency Detection and Response System

**A full-stack smart-city emergency reporting, sensor alerting, real-time monitoring, and responder dispatch platform for Bengaluru-style urban incident management.**

---

## 1. Project Title

**Smart Emergency Detection and Response System**

Professional subtitle: **Real-time incident reporting, IoT sensor alert ingestion, geospatial responder lookup, and administrative dispatch coordination.**

The project name is inferred from the repository and UI copy:

- Repository folder: `Emergency_System`
- React app package: `smart-city-frontend`
- Browser title: `Smart Emergency System`
- Login branding: `Smart City Emergency`
- Existing README title: `Smart Emergency Detection and Response System`

---

## 2. Project Overview

Smart Emergency Detection and Response System is a local full-stack web application that helps citizens report emergencies and helps administrators monitor, route, and dispatch responders. The system combines:

- Citizen-submitted incident reports with type, description, location, and optional camera evidence.
- Sensor-generated emergency alerts from simulated HTTP sensors or UDP-connected hardware.
- Django REST APIs for authentication, incidents, dashboard data, dispatch, and sensor alert ingestion.
- WebSocket broadcasts for real-time incident creation and status updates.
- React dashboards for citizens and administrators.
- Leaflet/OpenStreetMap map visualization for incidents, responders, routes, and traffic signal markers.
- OpenStreetMap Overpass API lookup for nearby hospitals, fire stations, and police services.
- OSRM route generation for emergency service-to-incident route previews and dispatch paths.

### Purpose

The purpose of the system is to reduce the coordination gap between emergency detection, incident reporting, and response dispatch. It gives citizens a simple reporting interface while giving administrators a live control center for triaging incidents and dispatching the nearest relevant emergency services.

### Real-World Problem Solved

Urban emergencies often fail because detection, reporting, verification, responder location, routing, and traffic management live in disconnected systems. This project models an integrated smart-city workflow where:

1. A citizen or sensor identifies an emergency.
2. The backend stores the event as an incident.
3. Connected dashboards receive the event immediately.
4. Administrators inspect the location and nearby services.
5. Dispatch creates a response route and traffic signal markers.
6. The incident status updates across clients in real time.

### Target Users

| User Type | Role in the System |
|---|---|
| Citizens | Register, log in, report emergencies, attach location and camera evidence, view incident updates. |
| Admin operators | Monitor incident queues, preview nearby services, dispatch responders, view maps and active routes. |
| IoT/sensor devices | Send accident, gas, and fire alerts through HTTP or UDP-to-HTTP forwarding. |
| Emergency response teams | Represented by dispatch records, vehicles, nearby services, and route visualization. |
| Developers/evaluators | Study a complete Django + React emergency workflow with authentication, WebSockets, mapping, and external routing APIs. |

### Importance

This project is important because it demonstrates a practical emergency-management architecture where human reports and automated sensor detections converge into a single operational workflow. It is useful for smart-city prototypes, hackathons, academic demonstrations, and early-stage public safety systems.

---

## 3. Project Idea / Concept

The core idea is to build an emergency coordination platform that accepts alerts from two sources:

- **Citizens** through the React dashboard.
- **Sensors** through `sensor_server.py`, `receiver.py`, and `POST /api/sensor-alert/`.

Both sources eventually create an `Incident` in the backend. Incidents are then broadcast to all connected dashboards over Django Channels WebSockets.

### Workflow Concept

```text
Citizen / Sensor
      |
      v
Django REST API
      |
      v
MySQL Incident + SensorData storage
      |
      v
WebSocket broadcast to dashboards
      |
      v
Admin selects incident
      |
      v
Overpass nearby-service lookup + OSRM route generation
      |
      v
Dispatch creates Vehicle and TrafficSignal records
      |
      v
Incident status changes to dispatched
```

### Architecture Idea

The codebase follows a simple but clear layered architecture:

- **Frontend layer:** React single-page app with role-based dashboard rendering.
- **API layer:** Django REST Framework endpoints for authentication, incidents, sensors, dashboard, and dispatch.
- **Realtime layer:** Django Channels WebSocket group named `incidents`.
- **Persistence layer:** MySQL database through Django ORM models.
- **External geospatial layer:** OpenStreetMap tiles, Overpass service discovery, and OSRM routing.
- **Sensor integration layer:** Flask simulator and UDP receiver scripts that post alerts to Django.

### Communication Flow

| Source | Transport | Destination | Result |
|---|---|---|---|
| React login/register | HTTP/JSON | Django accounts API | JWT access/refresh tokens returned. |
| Citizen incident report | HTTP/JSON | DRF incident viewset | Incident and up to 3 images saved. |
| Sensor simulator | HTTP/JSON | `POST /api/sensor-alert/` | SensorData stored, incident may be created. |
| UDP hardware feed | UDP then HTTP | `receiver.py` then Django API | Threshold-based sensor alert forwarding. |
| Backend events | WebSocket | React dashboards | Live incident/status updates. |
| Admin dispatch | HTTP/JSON plus external HTTP | Django, Overpass, OSRM | Route, service, vehicle, and signal data returned. |

---

## 4. Features

### User Registration

- **What it does:** Creates a new citizen or admin account.
- **How it works internally:** `RegisterSerializer` validates password using Django password validators, creates the custom `User`, hashes the password with `set_password`, and returns JWT tokens.
- **Related files:** `backend/accounts/models.py`, `backend/accounts/serializers.py`, `backend/accounts/views.py`, `frontend/src/pages/AuthPage.js`.
- **API involved:** `POST /api/register/`.

### JWT Login

- **What it does:** Authenticates users by email and password.
- **How it works internally:** `login_view` calls Django `authenticate(username=email, password=password)`, generates Simple JWT refresh/access tokens, and returns user identity fields.
- **Related files:** `backend/accounts/views.py`, `frontend/src/services/api.js`, `frontend/src/App.js`.
- **API involved:** `POST /api/login/`.

### Role-Based Frontend Routing

- **What it does:** Shows citizen or admin dashboard based on `user.role`.
- **How it works internally:** `App.js` reads `user` from `localStorage`; if the role is `admin`, it renders `AdminDashboard`, otherwise `CitizenDashboard`.
- **Related files:** `frontend/src/App.js`, `frontend/src/pages/AdminDashboard.js`, `frontend/src/pages/CitizenDashboard.js`.

### Citizen Incident Reporting

- **What it does:** Allows citizens to create emergency reports for accident, fire, gas, and health emergencies.
- **How it works internally:** `ReportIncidentModal` collects incident type, optional description, browser geolocation or manual coordinates, and up to 3 camera captures. `CitizenDashboard` sends the payload to `POST /api/incidents/`.
- **Related files:** `frontend/src/pages/CitizenDashboard.js`, `frontend/src/components/ReportIncidentModal.js`, `backend/incidents/views.py`.
- **API involved:** `POST /api/incidents/`.

### Camera Evidence Capture

- **What it does:** Lets users capture image evidence from the browser camera.
- **How it works internally:** `navigator.mediaDevices.getUserMedia` starts video, `canvas.toDataURL("image/jpeg", 0.7)` converts captures to base64, and backend `perform_create` decodes images into `IncidentImage` records.
- **Related files:** `frontend/src/components/ReportIncidentModal.js`, `backend/incidents/views.py`, `backend/incidents/models.py`.
- **Storage:** Images are saved under `backend/media/incident_images/` through Django `ImageField`.

### Location Capture

- **What it does:** Adds latitude and longitude to incidents.
- **How it works internally:** The modal first tries `navigator.geolocation.getCurrentPosition`; if unavailable, users can manually enter coordinates.
- **Related files:** `frontend/src/components/ReportIncidentModal.js`, `backend/incidents/models.py`.

### Incident List and Status Display

- **What it does:** Displays incidents with type, description, and status color.
- **How it works internally:** `IncidentCard` receives incident props and maps statuses to colors.
- **Related files:** `frontend/src/components/IncidentCard.js`.
- **API involved:** `GET /api/incidents/`, `GET /api/dashboard/`.

### Sensor Alert API

- **What it does:** Accepts sensor-originated accident, fire, and gas alerts without requiring JWT.
- **How it works internally:** `sensor_alert_view` validates payload through `SensorAlertSerializer`, records raw `SensorData`, suppresses nearby duplicate active incidents, creates an `Incident` when appropriate, and broadcasts it.
- **Related files:** `backend/sensors/views.py`, `backend/incidents/serializers.py`, `backend/incidents/models.py`.
- **API involved:** `POST /api/sensor-alert/`.

### Duplicate Sensor Alert Suppression

- **What it does:** Prevents repeated sensor alerts from creating many incidents for the same active event area.
- **How it works internally:** The backend checks active sensor incidents of the same type created within 15 minutes and within 0.35 km using Haversine distance.
- **Related files:** `backend/sensors/views.py`.

### Sensor Simulator

- **What it does:** Simulates emergency alerts at periodic intervals.
- **How it works internally:** `sensor_server.py` runs a Flask health endpoint and a background thread that posts a random accident, gas, or fire payload every 300 seconds to Django.
- **Related files:** `sensor_server.py`.
- **API involved:** `POST /api/sensor-alert/`.

### UDP Sensor Receiver

- **What it does:** Receives UDP sensor packets and forwards threshold-triggered alerts to the Django backend.
- **How it works internally:** `receiver.py` listens on UDP port `5005`, parses timestamp-prefixed JSON messages, detects accident/gas/fire conditions, and posts alerts to Django when `requests` is installed.
- **Related files:** `receiver.py`.

### Real-Time Incident Updates

- **What it does:** Pushes new incidents and status changes to active clients.
- **How it works internally:** `broadcast_incident` sends events to Channels group `incidents`; `IncidentConsumer` forwards JSON messages to WebSocket clients.
- **Related files:** `backend/incidents/realtime.py`, `backend/incidents/consumers.py`, `backend/incidents/routing.py`, `backend/smart_city_backend/asgi.py`.
- **WebSocket:** `ws://localhost:8000/ws/incidents/`.

### Admin Control Center

- **What it does:** Lets admins monitor pending, live, and completed incidents.
- **How it works internally:** `AdminDashboard` loads dashboard data, filters incidents by status tab, listens to WebSockets, previews services, and dispatches responders.
- **Related files:** `frontend/src/pages/AdminDashboard.js`, `backend/admin_panel/views.py`.
- **APIs involved:** `GET /api/dashboard/`, `GET /api/nearby-services/`, `POST /api/dispatch/`.

### Map Visualization

- **What it does:** Renders incidents, nearby services, routes, traffic signals, and junction markers.
- **How it works internally:** `MapPanel` uses React Leaflet components and OpenStreetMap tile URLs.
- **Related files:** `frontend/src/components/MapPanel.js`.
- **Services involved:** OpenStreetMap tiles.

### Nearby Emergency Service Lookup

- **What it does:** Finds hospitals, fire stations, or police facilities based on incident type.
- **How it works internally:** `fetch_osm_services` builds Overpass queries using incident-specific amenity selectors and searches around the incident and Bengaluru fallback center.
- **Related files:** `backend/admin_panel/views.py`.
- **External APIs:** Overpass API endpoints.

### Route Preview and Dispatch Routing

- **What it does:** Generates route geometry between a selected emergency service and the incident.
- **How it works internally:** `osrm_route` calls OSRM public route API using driving profile and returns GeoJSON coordinates converted into `{lat, lng}` objects.
- **Related files:** `backend/admin_panel/views.py`.
- **External API:** `https://router.project-osrm.org`.

### Vehicle Dispatch Records

- **What it does:** Creates dispatched vehicle records when an admin dispatches an incident.
- **How it works internally:** `dispatch_view` creates one or more `Vehicle` rows with type from request payload, status `dispatched`, and initial location from the route start.
- **Related files:** `backend/admin_panel/views.py`, `backend/incidents/models.py`.

### Traffic Signal Markers

- **What it does:** Simulates route-adjacent traffic signals and their red/green state.
- **How it works internally:** `dispatch_view` samples route points, computes distance to the incident, and creates `TrafficSignal` records. Points within 1 km are marked green; others red.
- **Related files:** `backend/admin_panel/views.py`, `backend/incidents/models.py`.

---

## 5. System Architecture

### High-Level Architecture

```text
                         +--------------------------+
                         |   React Frontend         |
                         |   Auth / Citizen / Admin |
                         +------------+-------------+
                                      |
                    HTTP REST + JWT   |   WebSocket
                                      v
                         +------------+-------------+
                         | Django ASGI Application  |
                         | DRF + Channels + JWT     |
                         +------------+-------------+
                                      |
                         +------------+-------------+
                         | MySQL Database           |
                         | Users, Incidents, Images |
                         | Sensors, Vehicles,       |
                         | Traffic Signals          |
                         +------------+-------------+
                                      |
             +------------------------+------------------------+
             |                                                 |
             v                                                 v
  Sensor Simulator / UDP Receiver                    Overpass + OSRM + OSM Tiles
```

### Frontend Architecture

The frontend is a React 18 single-page application created around simple page and component boundaries:

| Area | Files | Responsibility |
|---|---|---|
| App shell | `frontend/src/App.js` | Loads persisted user, handles logout, chooses dashboard by role. |
| Auth page | `frontend/src/pages/AuthPage.js` | Login/register form, password visibility toggle, JWT storage. |
| Citizen page | `frontend/src/pages/CitizenDashboard.js` | Loads incidents, subscribes to WebSocket, opens report modal. |
| Admin page | `frontend/src/pages/AdminDashboard.js` | Dashboard data, status tabs, service preview, dispatch workflow, route persistence. |
| Map | `frontend/src/components/MapPanel.js` | Leaflet map markers, polylines, traffic signals. |
| Incident card | `frontend/src/components/IncidentCard.js` | Incident summary and optional dispatch action. |
| Report modal | `frontend/src/components/ReportIncidentModal.js` | Camera, geolocation, manual coordinates, submit payload. |
| API client | `frontend/src/services/api.js` | Axios instance, base URL, JWT Authorization header. |

### Backend Architecture

The backend is a Django project named `smart_city_backend` with four application modules:

| App | Responsibility |
|---|---|
| `accounts` | Custom user model, registration, login, JWT token generation. |
| `incidents` | Incident models, serializers, REST viewset, images, WebSocket consumer, realtime broadcaster. |
| `sensors` | Public sensor alert ingestion, duplicate suppression, sensor data persistence. |
| `admin_panel` | Dashboard aggregation, OSM service lookup, OSRM routing, dispatch workflow. |

### Database Architecture

The database is MySQL through Django ORM. Main persisted entities are:

- `accounts.User`
- `incidents.Incident`
- `incidents.IncidentImage`
- `incidents.SensorData`
- `incidents.EmergencyService`
- `incidents.Vehicle`
- `incidents.TrafficSignal`

### API Flow

```text
React Axios client
  -> /api/login/ or /api/register/
  -> store access token in localStorage
  -> attach Authorization: Bearer <token>
  -> call protected /api/incidents/, /api/dashboard/, /api/dispatch/
```

Sensor flow is intentionally public:

```text
Sensor script or hardware
  -> POST /api/sensor-alert/
  -> SensorData row
  -> duplicate check
  -> Incident row if not duplicate
  -> WebSocket broadcast
```

### Authentication Flow

1. User registers or logs in with email/password.
2. Backend returns Simple JWT access and refresh tokens.
3. Frontend stores access token and user object in `localStorage`.
4. Axios attaches `Authorization: Bearer <token>`.
5. DRF authenticates protected API calls with `JWTAuthentication`.

### Module Communication

- `sensors.views` imports `Incident`, `SensorData`, `IncidentSerializer`, and `broadcast_incident`.
- `admin_panel.views` imports `Incident`, `Vehicle`, `TrafficSignal`, serializers, and routing utilities.
- `incidents.views` calls `broadcast_incident` after incident creation and status updates.
- React dashboards consume the same WebSocket channel and update local state when a payload arrives.

---

## 6. Technology Stack

### Frontend Technologies

| Technology | Why It Is Used | Where It Is Used |
|---|---|---|
| React 18 | Builds the interactive single-page app. | `frontend/src/App.js`, pages, components. |
| React DOM | Mounts the React app into `#root`. | `frontend/src/index.js`. |
| Axios | Makes REST API calls and attaches JWT headers. | `frontend/src/services/api.js`. |
| Leaflet | Provides map primitives and icons. | `frontend/src/components/MapPanel.js`. |
| React Leaflet | React bindings for Leaflet map rendering. | `MapContainer`, `Marker`, `Polyline`, `Popup`, `TileLayer`. |
| Browser Geolocation API | Captures citizen incident location. | `ReportIncidentModal.js`. |
| Browser MediaDevices API | Captures incident evidence from camera. | `ReportIncidentModal.js`. |
| localStorage | Persists user, token, and route previews locally. | `App.js`, `api.js`, `AdminDashboard.js`. |

### Backend Technologies

| Technology | Why It Is Used | Where It Is Used |
|---|---|---|
| Django | Main backend framework and ORM. | `backend/smart_city_backend`, all Django apps. |
| Django REST Framework | REST API endpoints, serializers, viewsets. | `accounts`, `incidents`, `sensors`, `admin_panel`. |
| Django Channels | WebSocket support for real-time incidents. | `asgi.py`, `incidents/consumers.py`, `incidents/realtime.py`. |
| Daphne | ASGI server suitable for HTTP + WebSocket. | Listed in `backend/requirements.txt`. |
| python-dotenv | Loads `.env` values into Django and scripts. | `settings.py`, `sensor_server.py`, `receiver.py`. |
| Pillow | Supports Django image field processing. | `IncidentImage.image`. |
| Requests | Calls Django from scripts and external route/service APIs from backend. | `sensor_server.py`, `receiver.py`, `admin_panel/views.py`. |

### Database Technologies

| Technology | Why It Is Used | Where It Is Used |
|---|---|---|
| MySQL | Persistent relational database. | `DATABASES` in `backend/smart_city_backend/settings.py`. |
| Django ORM | Defines schema and relationships in Python models. | `accounts/models.py`, `incidents/models.py`. |
| JSONField | Stores vehicle current location as structured JSON. | `Vehicle.current_location`. |

### Authentication Technologies

| Technology | Why It Is Used | Where It Is Used |
|---|---|---|
| Django custom user model | Supports email login and role field. | `accounts.User`. |
| Simple JWT | Issues access and refresh tokens. | `accounts/views.py`, `settings.py`. |
| Django password hashing | Stores secure password hashes. | `RegisterSerializer.create`. |
| DRF permissions | Applies authenticated default access. | `settings.py`, `IncidentViewSet`. |

### APIs Used

| API | Purpose | Where It Is Used |
|---|---|---|
| OpenStreetMap tile server | Map base layer. | `MapPanel.js`. |
| Overpass API | Nearby hospitals, fire stations, police lookup. | `admin_panel/views.py`. |
| OSRM route API | Driving route geometry. | `admin_panel/views.py`. |
| Browser Geolocation API | Citizen location capture. | `ReportIncidentModal.js`. |
| Browser Camera API | Evidence image capture. | `ReportIncidentModal.js`. |

### Libraries Used

| Library | Purpose |
|---|---|
| `axios` | HTTP client. |
| `leaflet` | Map rendering engine. |
| `react-leaflet` | React wrapper around Leaflet. |
| `djangorestframework` | API framework. |
| `djangorestframework-simplejwt` | JWT authentication. |
| `django-cors-headers` | Cross-origin frontend/backend communication. |
| `channels` | WebSocket support. |
| `mysqlclient` | MySQL database adapter. |
| `Pillow` | Image upload support. |
| `requests` | HTTP client for scripts and external APIs. |

### Deployment Tools

| Tool | Status in Codebase |
|---|---|
| Daphne | Present and intended for running the ASGI backend. |
| React build scripts | Present through `react-scripts build`. |
| Docker | Not present. No `Dockerfile` or `docker-compose.yml` exists. |
| Kubernetes | Not present. |

### DevOps Tools

| Tool | Status |
|---|---|
| Git | Repository contains `.gitignore`; version control is implied. |
| CI/CD | No GitHub Actions, GitLab CI, Jenkins, or similar config detected. |
| Monitoring | No monitoring integration detected. |
| Logging | Uses default Django behavior and script `print` statements. |

### Cloud Services

No cloud-specific SDK or deployment configuration is present. The project uses public external geospatial services:

- Overpass API
- OSRM demo route server
- OpenStreetMap tiles

### AI/ML Technologies

No AI/ML model, training pipeline, inference library, or ML dependency is present.

### Notification Services

No SMS, email, push notification, Firebase, Twilio, or SMTP workflow is implemented. Real-time browser notification is handled through WebSockets only.

### Mapping/GPS Services

- OpenStreetMap tiles for map display.
- Overpass API for nearby emergency service discovery.
- OSRM for driving routes.
- Browser geolocation for citizen coordinates.

### Realtime Communication Technologies

- Django Channels
- ASGI
- WebSocket endpoint `ws/incidents/`
- In-memory channel layer

### Testing Frameworks

No test files or test framework configuration are present beyond what Django/React tooling can support by default.

---

## 7. Tools and Software Used

| Category | Tools Detected or Applicable | Evidence |
|---|---|---|
| IDE | Any JavaScript/Python IDE; current active file suggests VS Code-compatible workflow. | User IDE context references open tabs. |
| Package managers | `pip`, `npm` | `backend/requirements.txt`, `frontend/package.json`, `package-lock.json`. |
| Build tools | `react-scripts` | `frontend/package.json`. |
| Backend CLI | `python manage.py` | `backend/manage.py`. |
| ASGI server | `daphne` | `backend/requirements.txt`, Channels configuration. |
| Version control | Git | `.gitignore`, `.git` directory. |
| API testing tools | Not committed; Postman/Insomnia/curl can be used. | API is HTTP/JSON. |
| Containerization | Not present. | No Docker files detected. |
| CI/CD | Not present. | No workflow files detected. |
| Environment management | `.env`, `.env.example`, `python-dotenv`, React `REACT_APP_*` variables. | Root and frontend env examples. |
| Database tool | MySQL server/client | Django MySQL configuration. |

---

## 8. Folder Structure Explanation

The following tree excludes heavy/generated directories such as `frontend/node_modules/`, `backend/.venv/`, `__pycache__/`, `.git/`, and runtime media contents except where relevant.

```text
Emergency_System/
├── .env.example
├── .gitignore
├── README.md
├── receiver.py
├── sensor_server.py
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── accounts/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── migrations/
│   │   │   ├── __init__.py
│   │   │   └── 0001_initial.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── admin_panel/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── migrations/
│   │   │   └── __init__.py
│   │   ├── routing_utils.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── incidents/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── consumers.py
│   │   ├── migrations/
│   │   │   ├── __init__.py
│   │   │   └── 0001_initial.py
│   │   ├── models.py
│   │   ├── realtime.py
│   │   ├── routing.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── media/
│   │   └── incident_images/
│   ├── sensors/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── migrations/
│   │   │   └── __init__.py
│   │   ├── urls.py
│   │   └── views.py
│   └── smart_city_backend/
│       ├── __init__.py
│       ├── asgi.py
│       ├── settings.py
│       ├── urls.py
│       └── wsgi.py
└── frontend/
    ├── .env.example
    ├── package-lock.json
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── components/
        │   ├── IncidentCard.js
        │   ├── MapPanel.js
        │   └── ReportIncidentModal.js
        ├── pages/
        │   ├── AdminDashboard.js
        │   ├── AuthPage.js
        │   └── CitizenDashboard.js
        └── services/
            └── api.js
```

### Root Files

| File | Purpose |
|---|---|
| `.env.example` | Template for backend, scripts, sensor, MySQL, React, and WebSocket variables. |
| `.gitignore` | Ignores local secrets, Python caches, virtualenv, Django media, React dependencies, and build output. |
| `README.md` | Main project documentation. |
| `sensor_server.py` | Flask-based simulated sensor alert generator. |
| `receiver.py` | UDP receiver that parses sensor packets and forwards detected alerts. |

### Backend Files

| File/Folder | Purpose and Important Code |
|---|---|
| `backend/manage.py` | Standard Django CLI entry point. Runs migrations, development server, and management commands. |
| `backend/requirements.txt` | Backend dependencies including Django, DRF, Simple JWT, Channels, MySQL, Pillow, Daphne, dotenv, and requests. |
| `backend/smart_city_backend/settings.py` | Core settings: apps, middleware, MySQL, custom user model, REST JWT auth, CORS, media, Channels. |
| `backend/smart_city_backend/urls.py` | Mounts all API modules under `/api/` and Django admin under `/admin/`. |
| `backend/smart_city_backend/asgi.py` | Routes HTTP to Django and WebSocket traffic to incident routing through `AuthMiddlewareStack`. |
| `backend/smart_city_backend/wsgi.py` | Traditional WSGI entry point for non-WebSocket deployments. |
| `backend/accounts/models.py` | Defines custom `User` with `name`, unique `email`, and `role`. |
| `backend/accounts/serializers.py` | Defines `RegisterSerializer`, password validation, and user creation. |
| `backend/accounts/views.py` | Implements `register_view` and `login_view`. |
| `backend/accounts/urls.py` | Exposes `/api/register/` and `/api/login/`. |
| `backend/incidents/models.py` | Defines incidents, images, sensor data, emergency services, vehicles, and traffic signals. |
| `backend/incidents/serializers.py` | Serializes incident models and validates sensor alert payloads. |
| `backend/incidents/views.py` | DRF `IncidentViewSet` with image handling and status broadcast actions. |
| `backend/incidents/realtime.py` | Sends event payloads to the Channels group. |
| `backend/incidents/consumers.py` | WebSocket consumer for connected dashboards. |
| `backend/incidents/routing.py` | WebSocket URL route `ws/incidents/`. |
| `backend/incidents/urls.py` | Registers `IncidentViewSet` under `/api/incidents/`. |
| `backend/sensors/views.py` | Sensor alert validation, raw sensor storage, duplicate suppression, incident creation. |
| `backend/sensors/urls.py` | Exposes `/api/sensor-alert/`. |
| `backend/admin_panel/views.py` | Dashboard aggregation, Overpass lookup, OSRM route generation, dispatch. |
| `backend/admin_panel/routing_utils.py` | Haversine math and simulated Bengaluru route helpers; currently not called by `dispatch_view`. |
| `backend/media/incident_images/` | Runtime upload destination for incident evidence images; ignored by Git. |

### Frontend Files

| File/Folder | Purpose and Important Code |
|---|---|
| `frontend/package.json` | React app metadata, dependencies, scripts, and proxy to backend. |
| `frontend/package-lock.json` | Locked npm dependency versions. |
| `frontend/.env.example` | React-specific API and WebSocket environment variables. |
| `frontend/public/index.html` | HTML shell with `Smart Emergency System` title and root div. |
| `frontend/src/index.js` | Imports Leaflet CSS and renders `<App />`. |
| `frontend/src/App.js` | Auth persistence, logout, and role-based dashboard selection. |
| `frontend/src/services/api.js` | Axios base URL and JWT token helper. |
| `frontend/src/pages/AuthPage.js` | Login/register UI and API calls. |
| `frontend/src/pages/CitizenDashboard.js` | Incident list, WebSocket subscription, report modal flow. |
| `frontend/src/pages/AdminDashboard.js` | Admin tabs, map state, service preview, dispatch, route caching. |
| `frontend/src/components/IncidentCard.js` | Reusable incident display card. |
| `frontend/src/components/ReportIncidentModal.js` | Report form, camera, geolocation, captured image payloads. |
| `frontend/src/components/MapPanel.js` | Leaflet markers, route lines, service markers, signal markers. |

---

## 9. Detailed Module Explanation

### Accounts Module

- **Purpose:** User identity, role storage, registration, and login.
- **Input:** Name, email, password, role for registration; email and password for login.
- **Output:** User object, JWT access token, JWT refresh token.
- **Internal workflow:** Serializer validates input, creates a custom user, hashes password, and views issue JWTs.
- **Dependencies:** Django auth, DRF serializers/views, Simple JWT.
- **APIs called:** No external APIs.
- **Data processing:** Maps email to username because `USERNAME_FIELD = "email"` and `username` remains required by `AbstractUser`.
- **Security considerations:** Password is hashed through Django. Password validators run during registration. Login returns only selected user fields.
- **Error handling:** Serializer validation raises DRF errors; invalid login returns `401` with `{"detail": "Invalid credentials"}`.

### Incidents Module

- **Purpose:** Core incident lifecycle and realtime event broadcasting.
- **Input:** Incident type, description, latitude, longitude, optional base64 images, status updates.
- **Output:** Incident JSON with nested images.
- **Internal workflow:** `IncidentViewSet` saves incident, decodes images, broadcasts `new_incident`; status actions broadcast `status_updated`.
- **Dependencies:** Django models, DRF viewsets, Channels broadcaster, base64 decoding, `ContentFile`.
- **APIs called:** WebSocket channel layer internally.
- **Data processing:** Converts base64 data URLs to JPEG files and limits captured images to three.
- **Security considerations:** `IncidentViewSet` requires authenticated users. `created_by` and `source` are server-assigned read-only fields.
- **Error handling:** DRF handles validation failures. Invalid base64 can raise decode errors because there is no explicit try/except around image decoding.

### Sensors Module

- **Purpose:** Accept sensor alerts and convert them into incidents.
- **Input:** `type`, `value`, `latitude`, `longitude`.
- **Output:** New incident response or duplicate-suppression response.
- **Internal workflow:** Validate alert, save `SensorData`, search recent active incidents, calculate Haversine distance, suppress duplicate or create incident.
- **Dependencies:** DRF, Django ORM, incident serializer, realtime broadcaster.
- **APIs called:** No external APIs.
- **Data processing:** Maps incident type to hardware sensor type: accident to `mpu6050`, gas to `mq2`, fire to `fire`.
- **Security considerations:** Endpoint allows anonymous access so devices can post without JWT. Production deployments should add device keys, signatures, or network restrictions.
- **Error handling:** Serializer validation handles invalid types and missing fields.

### Admin Panel Module

- **Purpose:** Operational dashboard, emergency service discovery, route preview, dispatch, vehicle and signal creation.
- **Input:** Incident ID, optional vehicle count/type.
- **Output:** Incidents, status counts, nearby services, route geometry, vehicles, traffic signal states.
- **Internal workflow:** Dashboard reads incidents. Nearby lookup queries Overpass, sorts services by Haversine distance, route preview calls OSRM. Dispatch repeats lookup/routing, creates vehicle and signal rows, updates incident status.
- **Dependencies:** Django ORM, DRF, `requests`, Overpass API, OSRM, Haversine utility.
- **APIs called:** Overpass and OSRM public endpoints.
- **Data processing:** Filters hospital names to avoid clinics/diagnostics when incident type needs hospital service.
- **Security considerations:** Module uses DRF function views without explicit decorators; default global DRF auth settings do not automatically apply to plain `@api_view` unless permission classes are set through DRF settings, so verify access behavior before production.
- **Error handling:** Dispatch returns `503` if no services are available. External API failures are partially handled by fallback providers and broad exception handling.

### Realtime Module

- **Purpose:** Push incident events to browsers without polling.
- **Input:** Backend event name and payload.
- **Output:** WebSocket JSON messages.
- **Internal workflow:** Backend calls `broadcast_incident`; Channels sends to group `incidents`; `IncidentConsumer.incident_message` serializes to JSON and sends to client.
- **Dependencies:** Django Channels, ASGI, in-memory channel layer.
- **Security considerations:** WebSocket route uses `AuthMiddlewareStack`, but the consumer currently accepts every connection and does not enforce authenticated session/JWT.
- **Error handling:** No custom reconnect/backoff logic in the backend; frontend simply closes socket on unmount.

### Frontend Module

- **Purpose:** User interface for authentication, reporting, monitoring, dispatching, and map visualization.
- **Input:** User form values, browser camera, geolocation, API responses, WebSocket messages.
- **Output:** Dashboard UI, incident reports, dispatch commands, map overlays.
- **Internal workflow:** Auth page obtains token, `api.js` stores token, role-based dashboard loads data and receives realtime updates.
- **Dependencies:** React, Axios, Leaflet, React Leaflet, browser APIs.
- **Security considerations:** Access token is stored in `localStorage`, which is convenient but vulnerable to XSS exposure.
- **Error handling:** User-facing errors exist for auth, dashboard loading, modal geolocation/camera, incident submit, nearby lookup, and dispatch.

---

## 10. Function-by-Function Explanation

### Backend Functions and Methods

| Function | Location | Purpose | Parameters | Returns | Logic and Dependencies | Example Usage |
|---|---|---|---|---|---|---|
| `User.__str__` | `backend/accounts/models.py` | Human-readable user label. | `self` | String with name and role. | Formats custom user fields. | Django admin/debug display. |
| `RegisterSerializer.validate_password` | `backend/accounts/serializers.py` | Validate password strength. | `value` | Validated password. | Calls Django `validate_password`. | Triggered by serializer validation. |
| `RegisterSerializer.create` | `backend/accounts/serializers.py` | Create custom user. | `validated_data` | `User` instance. | Sets username/email/name/role and hashes password. | `serializer.save()`. |
| `register_view` | `backend/accounts/views.py` | Register user and issue tokens. | DRF `request` | `201` response. | Validates serializer, saves user, creates `RefreshToken`. | `POST /api/register/`. |
| `login_view` | `backend/accounts/views.py` | Authenticate user and issue tokens. | DRF `request` | `200` or `401`. | Calls `authenticate`, creates JWT pair. | `POST /api/login/`. |
| `IncidentViewSet.perform_create` | `backend/incidents/views.py` | Save incident and images, broadcast event. | `serializer` | None. | Sets source/creator, decodes up to 3 images, calls `broadcast_incident`. | DRF calls during `POST /api/incidents/`. |
| `IncidentViewSet.update_status` | `backend/incidents/views.py` | Custom status update action. | `request`, `pk` | Updated incident response. | Saves status and broadcasts `status_updated`. | `PATCH /api/incidents/{id}/status/`. |
| `IncidentViewSet.partial_update` | `backend/incidents/views.py` | Patch incident and broadcast update. | `request`, `*args`, `**kwargs` | DRF response. | Delegates to DRF then broadcasts response data. | `PATCH /api/incidents/{id}/`. |
| `broadcast_incident` | `backend/incidents/realtime.py` | Send event to WebSocket group. | `event_name`, `payload` | None. | Uses Channels `get_channel_layer` and `group_send`. | Called after incident creation/status changes. |
| `IncidentConsumer.connect` | `backend/incidents/consumers.py` | Accept WebSocket client. | `self` | Awaitable side effect. | Adds connection to `incidents` group and accepts. | Browser connects to `/ws/incidents/`. |
| `IncidentConsumer.disconnect` | `backend/incidents/consumers.py` | Remove WebSocket client. | `self`, `close_code` | Awaitable side effect. | Discards channel from group. | Browser disconnects. |
| `IncidentConsumer.incident_message` | `backend/incidents/consumers.py` | Forward group event to client. | `self`, `event` | Awaitable side effect. | Sends JSON with `event` and `payload`. | Called by Channels group dispatch. |
| `sensors.haversine_km` | `backend/sensors/views.py` | Calculate distance between coordinates. | `lat1`, `lon1`, `lat2`, `lon2` | Kilometers. | Haversine formula with earth radius 6371 km. | Duplicate suppression. |
| `sensor_alert_view` | `backend/sensors/views.py` | Convert sensor alert to incident. | DRF `request` | Duplicate response or new incident response. | Validates payload, stores sensor data, checks duplicate radius/window, creates incident. | `POST /api/sensor-alert/`. |
| `service_types_for_incident` | `backend/admin_panel/views.py` | Map incident type to service type. | `incident_type` | List of service types. | Health -> hospital, fire/gas -> fire station, accident -> hospital/fire station, fallback police. | Used by Overpass query builder. |
| `osrm_route` | `backend/admin_panel/views.py` | Fetch driving route geometry. | `start_lat`, `start_lng`, `end_lat`, `end_lng` | List of `{lat,lng}` route points. | Calls OSRM route API and converts GeoJSON coordinates. | Nearby preview and dispatch. |
| `fetch_osm_services` | `backend/admin_panel/views.py` | Find nearby emergency services. | `lat`, `lng`, `incident_type`, `radius_m`, `limit` | Ranked service list. | Builds Overpass queries, retries endpoints/radii, filters and sorts by distance. | `nearby_services_view`, `dispatch_view`. |
| `dashboard_view` | `backend/admin_panel/views.py` | Return admin dashboard data. | DRF `request` | Incidents, empty services/junctions, counts. | Queries latest 100 incidents and status counts. | `GET /api/dashboard/`. |
| `nearby_services_view` | `backend/admin_panel/views.py` | Preview nearby services and route. | DRF `request` | Service list and route preview. | Reads `incident_id`, fetches services, calls OSRM for nearest service route. | `GET /api/nearby-services/?incident_id=1`. |
| `dispatch_view` | `backend/admin_panel/views.py` | Dispatch responders. | DRF `request` | Service, vehicles, route, signals. | Fetches service, routes, creates vehicles/signals, updates incident status. | `POST /api/dispatch/`. |
| `routing_utils.haversine_km` | `backend/admin_panel/routing_utils.py` | Distance calculation helper. | `lat1`, `lon1`, `lat2`, `lon2` | Kilometers. | Same Haversine math. | Imported by `admin_panel/views.py`. |
| `ensure_default_services` | `backend/admin_panel/routing_utils.py` | Seed default emergency services. | None | None. | Creates default service rows only if none exist. | Available helper; not currently called by dispatch. |
| `nearest_point` | `backend/admin_panel/routing_utils.py` | Find closest point from a list. | `lat`, `lng`, `points` | `(point, distance)` | Iterates and compares Haversine distance. | Simulated route helper. |
| `interpolate_segment` | `backend/admin_panel/routing_utils.py` | Generate curved route segment. | `start`, `end`, `steps`, `curve_bias` | List of points. | Linear interpolation plus sinusoidal offset. | Used by `generate_simulated_route`. |
| `generate_simulated_route` | `backend/admin_panel/routing_utils.py` | Build local synthetic route. | `service`, `incident` | Route points. | Uses predefined Bengaluru junctions and interpolation. | Present but not wired into `dispatch_view`. |

### Sensor Script Functions

| Function | Location | Purpose | Parameters | Returns | Logic |
|---|---|---|---|---|---|
| `random_sensor_packet` | `sensor_server.py` | Generate simulated sensor readings. | None | Sensor packet dict. | Randomizes pitch, roll, gas, flame, temperature, and Bengaluru coordinates. |
| `detect_event` | `sensor_server.py` | Determine alert from packet. | `sensor` | `(type, value)` or `(None, None)`. | Accident if pitch/roll exceed 55, gas if MQ2 > 650, fire if flame or temperature > 58. |
| `loop_sender` | `sensor_server.py` | Periodically send alerts. | None | Infinite loop. | Posts one random emergency every 300 seconds. |
| `health` | `sensor_server.py` | Flask health endpoint. | None | JSON status. | Returns `{"status": "sensor_server_running"}`. |
| `detect_alert` | `receiver.py` | Detect event from UDP payload. | `payload` | `(type, value)` or `(None, None)`. | Tracks pitch/roll deltas and checks gas/flame/temperature thresholds. |
| `maybe_forward` | `receiver.py` | Forward detected UDP alert. | `message` | None. | Parses timestamp and JSON, detects alert, posts to Django. |

### Frontend Functions

| Function | Location | Purpose | Parameters | Returns | Logic |
|---|---|---|---|---|---|
| `App` | `frontend/src/App.js` | Root component. | None | React UI. | Loads user from localStorage and renders auth/citizen/admin view. |
| `logout` | `frontend/src/App.js` | Clear auth state. | None | None. | Clears token, user localStorage, and state. |
| `setToken` | `frontend/src/services/api.js` | Manage Axios JWT header. | `token` | None. | Adds or removes `Authorization` header and localStorage token. |
| `AuthPage` | `frontend/src/pages/AuthPage.js` | Login/register screen. | `onAuth` | React UI. | Posts auth payload, stores token/user, displays errors. |
| `submit` | `AuthPage.js` | Submit auth form. | None | Promise side effect. | Chooses login/register endpoint and payload. |
| `CitizenDashboard` | `frontend/src/pages/CitizenDashboard.js` | Citizen incident view. | None | React UI. | Loads incidents, subscribes WebSocket, opens modal. |
| `load` | `CitizenDashboard.js` | Load incidents. | None | Promise side effect. | Calls `GET incidents/`. |
| `createIncident` | `CitizenDashboard.js` | Submit incident report. | `payload` | Promise side effect. | Posts to `incidents/`, shows toast, reloads list. |
| `AdminDashboard` | `frontend/src/pages/AdminDashboard.js` | Admin control center. | None | React UI. | Loads dashboard, filters tabs, handles preview/dispatch, renders map. |
| `loadDashboard` | `AdminDashboard.js` | Load admin dashboard data. | None | Promise side effect. | Calls `GET dashboard/`. |
| `dispatch` | `AdminDashboard.js` | Dispatch selected incident. | `incident` | Promise side effect. | Calls `POST dispatch/`, stores route, signals, services, reloads dashboard. |
| `previewNearby` | `AdminDashboard.js` | Preview nearest services. | `incident` | Promise side effect. | Calls `GET nearby-services/?incident_id=...`. |
| `activeRoutes` | `AdminDashboard.js` | Compute map route overlays. | Memoized state | Array. | Filters cached routes to non-completed incidents and assigns colors. |
| `incidentStyle` | `MapPanel.js` | Style incident markers. | `type` | `{color,label}`. | Maps fire/gas/health/accident to marker styles. |
| `icon` | `MapPanel.js` | Build Leaflet div icon. | `color`, `label` | Leaflet icon. | Creates small colored HTML marker. |
| `MapPanel` | `MapPanel.js` | Render map. | Incidents, services, routes, signals, junctions | React UI. | Draws OSM tiles, markers, circles, and polylines. |
| `IncidentCard` | `IncidentCard.js` | Render incident item. | `incident`, `onDispatch`, `onSelect` | React UI. | Shows incident and optional dispatch button. |
| `ReportIncidentModal` | `ReportIncidentModal.js` | Incident report dialog. | `onClose`, `onSubmit`, `loading` | React UI. | Handles type, description, location, camera, captured images. |
| `fetchLocation` | `ReportIncidentModal.js` | Get current coordinates. | None | None. | Uses browser geolocation or sets error. |
| `startCamera` | `ReportIncidentModal.js` | Start camera stream. | None | Promise side effect. | Uses `getUserMedia` with rear camera preference. |
| `capture` | `ReportIncidentModal.js` | Capture frame as JPEG data URL. | None | None. | Draws video to canvas and stores up to 3 images. |
| `submit` | `ReportIncidentModal.js` | Submit report payload. | None | None. | Validates coordinates and calls parent `onSubmit`. |

---

## 11. API Documentation

Base API URL:

```text
http://localhost:8000/api/
```

Frontend default API base:

```text
/api/
```

### Authentication APIs

#### Register User

| Field | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/api/register/` |
| Purpose | Create user and issue JWT tokens. |
| Authentication | Not required. |

Request body:

```json
{
  "name": "Asha Rao",
  "email": "asha@example.com",
  "password": "StrongPassword123",
  "role": "citizen"
}
```

Response:

```json
{
  "user": {
    "id": 1,
    "name": "Asha Rao",
    "email": "asha@example.com",
    "role": "citizen"
  },
  "access": "jwt-access-token",
  "refresh": "jwt-refresh-token"
}
```

Error responses:

- `400 Bad Request` for validation errors.
- Password validator errors from Django if password is weak.

#### Login User

| Field | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/api/login/` |
| Purpose | Authenticate and issue JWT tokens. |
| Authentication | Not required. |

Request body:

```json
{
  "email": "asha@example.com",
  "password": "StrongPassword123"
}
```

Response:

```json
{
  "user": {
    "id": 1,
    "name": "Asha Rao",
    "email": "asha@example.com",
    "role": "citizen"
  },
  "access": "jwt-access-token",
  "refresh": "jwt-refresh-token"
}
```

Error response:

```json
{
  "detail": "Invalid credentials"
}
```

Status: `401 Unauthorized`.

### Incident APIs

The incident APIs are generated by DRF `DefaultRouter` and `ModelViewSet`.

#### List Incidents

| Field | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/api/incidents/` |
| Purpose | Return all incidents ordered by newest first. |
| Authentication | Required. |

Example request:

```bash
curl -H "Authorization: Bearer <access-token>" \
  http://localhost:8000/api/incidents/
```

Response:

```json
[
  {
    "id": 1,
    "type": "fire",
    "source": "citizen",
    "description": "Smoke near main road",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "status": "pending",
    "created_by": 1,
    "created_at": "2026-05-07T10:00:00Z",
    "updated_at": "2026-05-07T10:00:00Z",
    "images": []
  }
]
```

#### Create Incident

| Field | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/api/incidents/` |
| Purpose | Create citizen/admin incident report. |
| Authentication | Required. |

Request body:

```json
{
  "type": "accident",
  "description": "Two-wheeler collision near junction",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "captured_images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ]
}
```

Response: `201 Created` with incident object.

Internal behavior:

- `source` is set by backend:
  - `citizen` if the authenticated user role is `citizen`.
  - `sensor` otherwise.
- `created_by` is set from the authenticated user.
- Up to 3 base64 images are saved.
- `new_incident` is broadcast over WebSocket.

#### Retrieve Incident

| Field | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/api/incidents/{id}/` |
| Purpose | Retrieve one incident. |
| Authentication | Required. |

#### Update Incident

| Field | Value |
|---|---|
| Method | `PATCH` |
| Endpoint | `/api/incidents/{id}/` |
| Purpose | Partially update an incident. |
| Authentication | Required. |

Example body:

```json
{
  "status": "in_progress"
}
```

Response: Updated incident object. A `status_updated` WebSocket event is broadcast.

#### Update Incident Status

| Field | Value |
|---|---|
| Method | `PATCH` |
| Endpoint | `/api/incidents/{id}/status/` |
| Purpose | Update only incident status through custom action. |
| Authentication | Required. |

Request body:

```json
{
  "status": "completed"
}
```

Response: Updated incident object.

### Sensor APIs

#### Submit Sensor Alert

| Field | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/api/sensor-alert/` |
| Purpose | Accept accident, fire, or gas alert from sensors. |
| Authentication | Not required. |

Request body:

```json
{
  "type": "gas",
  "value": 720.5,
  "latitude": 12.9591,
  "longitude": 77.6974
}
```

Successful new incident response:

```json
{
  "id": 12,
  "type": "gas",
  "source": "sensor",
  "description": "Sensor triggered gas alert with value 720.5",
  "latitude": 12.9591,
  "longitude": 77.6974,
  "status": "pending",
  "created_by": null,
  "created_at": "2026-05-07T10:00:00Z",
  "updated_at": "2026-05-07T10:00:00Z",
  "images": []
}
```

Duplicate response:

```json
{
  "duplicate": true,
  "detail": "Duplicate sensor alert suppressed for same active incident area.",
  "incident": {
    "id": 12,
    "type": "gas",
    "source": "sensor",
    "status": "pending"
  }
}
```

Error responses:

- `400 Bad Request` for invalid `type`, missing coordinates, or invalid numeric values.

### Admin APIs

#### Dashboard Data

| Field | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/api/dashboard/` |
| Purpose | Return recent incidents and status counts. |
| Authentication | Intended for authenticated admin use. |

Response:

```json
{
  "incidents": [],
  "services": [],
  "junctions": [],
  "status_counts": [
    {
      "status": "pending",
      "total": 3
    }
  ]
}
```

Note: `services` and `junctions` are currently returned as empty arrays from this endpoint.

#### Nearby Services

| Field | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/api/nearby-services/?incident_id={id}` |
| Purpose | Find nearest relevant emergency services and preview route. |
| Authentication | Intended for admin use. |

Response:

```json
{
  "incident_id": 1,
  "incident_type": "fire",
  "nearby_services": [
    {
      "id": "osm-123",
      "name": "Fire Station",
      "type": "fire_station",
      "latitude": 12.98,
      "longitude": 77.59
    }
  ],
  "route_preview": [
    {
      "lat": 12.98,
      "lng": 77.59
    }
  ]
}
```

Error responses:

- `400 Bad Request` if `incident_id` is missing.
- Unhandled `Incident.DoesNotExist` can produce a server error if an invalid ID is supplied.

#### Dispatch Incident

| Field | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/api/dispatch/` |
| Purpose | Dispatch vehicles, update incident status, create traffic signal markers, return route. |
| Authentication | Intended for admin use. |

Request body:

```json
{
  "incident_id": 1,
  "vehicle_count": 1,
  "vehicle_type": "ambulance"
}
```

Response:

```json
{
  "incident_id": 1,
  "service": {
    "id": "osm-123",
    "name": "Nearest Hospital",
    "type": "hospital",
    "latitude": 12.98,
    "longitude": 77.59
  },
  "nearby_services": [],
  "vehicles": [
    {
      "id": 1,
      "type": "ambulance"
    }
  ],
  "route": [
    {
      "lat": 12.98,
      "lng": 77.59
    }
  ],
  "traffic_signals": [
    {
      "id": 1,
      "lat": 12.97,
      "lng": 77.59,
      "status": "green"
    }
  ]
}
```

Error responses:

- `503 Service Unavailable` if Overpass lookups cannot provide emergency services.
- External OSRM/Overpass failures may result in request failure if not recovered by fallback logic.

### WebSocket API

| Field | Value |
|---|---|
| Endpoint | `/ws/incidents/` |
| Protocol | WebSocket |
| Purpose | Push incident creation and status updates. |

Message format:

```json
{
  "event": "new_incident",
  "payload": {
    "id": 1,
    "type": "fire",
    "status": "pending"
  }
}
```

Event names:

| Event | Meaning |
|---|---|
| `new_incident` | A new citizen or sensor incident was created. |
| `status_updated` | An incident status or incident patch was applied. |

---

## 12. Database Design

### Database Type

The project uses **MySQL** with UTF-8 MB4 charset.

Configuration location:

```text
backend/smart_city_backend/settings.py
```

### Models

#### `accounts.User`

Extends Django `AbstractUser`.

| Field | Type | Purpose |
|---|---|---|
| `id` | BigAutoField | Primary key. |
| `username` | CharField | Required by AbstractUser; set to email during registration. |
| `name` | CharField(120) | User's display name. |
| `email` | EmailField(unique=True) | Login identifier and unique contact. |
| `role` | CharField | Either `citizen` or `admin`. |
| Standard auth fields | Various | Password, permissions, groups, staff flags, timestamps. |

#### `incidents.Incident`

| Field | Type | Purpose |
|---|---|---|
| `id` | BigAutoField | Primary key. |
| `type` | CharField | `accident`, `fire`, `gas`, `health`. |
| `source` | CharField | `sensor` or `citizen`. |
| `description` | TextField | Optional incident details. |
| `latitude` | FloatField | Incident latitude. |
| `longitude` | FloatField | Incident longitude. |
| `status` | CharField | `pending`, `dispatched`, `in_progress`, `completed`. |
| `created_by` | ForeignKey(User, nullable) | User who created the report; null for sensor incidents. |
| `created_at` | DateTimeField | Creation timestamp. |
| `updated_at` | DateTimeField | Last update timestamp. |

Ordering:

```python
ordering = ["-created_at"]
```

#### `incidents.IncidentImage`

| Field | Type | Purpose |
|---|---|---|
| `id` | BigAutoField | Primary key. |
| `incident` | ForeignKey(Incident) | Parent incident. |
| `image` | ImageField | Stored under `incident_images/`. |

Relationship:

- One incident can have many images through `related_name="images"`.

#### `incidents.SensorData`

| Field | Type | Purpose |
|---|---|---|
| `id` | BigAutoField | Primary key. |
| `type` | CharField | `mpu6050`, `mq2`, `fire`, `dht`. |
| `value` | FloatField | Sensor measurement value. |
| `latitude` | FloatField | Sensor latitude. |
| `longitude` | FloatField | Sensor longitude. |
| `timestamp` | DateTimeField | Ingestion time. |

#### `incidents.EmergencyService`

| Field | Type | Purpose |
|---|---|---|
| `id` | BigAutoField | Primary key. |
| `name` | CharField(120) | Local service name. |
| `type` | CharField | `hospital`, `fire_station`, `police`. |
| `latitude` | FloatField | Service latitude. |
| `longitude` | FloatField | Service longitude. |

Note: The current dispatch flow primarily uses live OSM services rather than this table.

#### `incidents.Vehicle`

| Field | Type | Purpose |
|---|---|---|
| `id` | BigAutoField | Primary key. |
| `type` | CharField | `ambulance`, `fire_truck`, `police_vehicle`. |
| `status` | CharField | Defaults to `available`, set to `dispatched` on dispatch. |
| `current_location` | JSONField | Route start location as `{lat,lng}`. |

#### `incidents.TrafficSignal`

| Field | Type | Purpose |
|---|---|---|
| `id` | BigAutoField | Primary key. |
| `latitude` | FloatField | Signal latitude. |
| `longitude` | FloatField | Signal longitude. |
| `status` | CharField | `red` or `green`. |
| `controlled_by_system` | BooleanField | Whether the system controls it. |

### Relationships

```text
User 1 ─── * Incident
Incident 1 ─── * IncidentImage
Incident dispatch creates * Vehicle records
Incident dispatch creates * TrafficSignal records
SensorData records are stored independently from Incident
EmergencyService records are available but not required for current OSM dispatch flow
```

### Indexing and Optimization

No custom indexes are defined in the models. Django creates primary key indexes and foreign key indexes automatically. For production, likely useful indexes include:

- `Incident(status, created_at)`
- `Incident(source, type, created_at)`
- `SensorData(type, timestamp)`
- geospatial indexing or separate spatial database support for latitude/longitude queries

---

## 13. Authentication & Security

### Authentication Mechanism

The backend uses **JWT authentication** through `djangorestframework-simplejwt`.

Configured in:

```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}
```

### Authorization

The custom user model supports two roles:

- `citizen`
- `admin`

Frontend authorization is role-based in `App.js`. Backend role checks are limited; for example, the incident source is derived from role during creation, but admin-only APIs do not currently enforce a custom admin permission class.

### JWT Handling

| Token | Lifetime |
|---|---|
| Access token | 8 hours |
| Refresh token | 7 days |

Frontend stores:

- `token` in `localStorage`
- `user` in `localStorage`

Axios attaches:

```text
Authorization: Bearer <token>
```

### Password Handling

- Registration calls Django `validate_password`.
- Passwords are saved using `user.set_password`.
- Plaintext passwords are never stored by application code.

### Middleware Protection

Enabled middleware includes:

- CORS middleware
- Django security middleware
- Session middleware
- CSRF middleware
- Authentication middleware
- Clickjacking protection

### API Security

| Area | Current Implementation | Production Recommendation |
|---|---|---|
| User APIs | Public register/login. | Add throttling and email verification. |
| Incident APIs | Protected by `IsAuthenticated`. | Add object-level permissions if needed. |
| Sensor API | Public `AllowAny`. | Add device API keys, HMAC signatures, or IP allowlists. |
| Admin APIs | Function views intended for admin usage. | Add explicit `IsAuthenticated` and role-based admin permission. |
| CORS | `CORS_ALLOW_ALL_ORIGINS = True`. | Restrict to trusted frontend origins. |
| Secret key | Loaded from `.env` with dev fallback. | Always set strong `DJANGO_SECRET_KEY` in production. |
| WebSocket | Accepts connections into group. | Authenticate or validate tokens for WebSocket connections. |
| Token storage | `localStorage`. | Consider httpOnly secure cookies or strict CSP/XSS prevention. |

---

## 14. Realtime / Emergency Workflow

### WebSocket Architecture

```text
Backend event
  -> broadcast_incident(event_name, payload)
  -> Channels group_send("incidents", ...)
  -> IncidentConsumer.incident_message
  -> WebSocket client receives JSON
  -> React updates incidents state
```

### Alert Generation

Alerts can be generated in three ways:

1. Citizen report from `ReportIncidentModal`.
2. Simulated alert from `sensor_server.py`.
3. UDP sensor packet received by `receiver.py`.

### Emergency Triggering Flow

Sensor thresholds:

| Signal | Logic |
|---|---|
| Accident | Pitch or roll absolute value greater than 55, or receiver pitch/roll delta greater than 28. |
| Gas | Gas state not clean/normal/0, or MQ2 value greater than 650. |
| Fire | Flame equals 1, or temperature greater than 58. |

### Notification Delivery

The implemented notification channel is WebSocket broadcast to connected browser clients. No SMS/email/push service is implemented.

### Tracking and Location Flow

- Citizen reports use browser geolocation or manual coordinates.
- Sensor alerts include latitude and longitude from packet payload or simulated Bengaluru coordinates.
- Admin route preview uses route points from OSRM.
- Vehicles store their current initial route position in `Vehicle.current_location`.
- Traffic signal markers are sampled from the dispatch route.

### Response Handling

Dispatch response handling:

1. Admin clicks an incident.
2. Frontend calls nearby-service preview.
3. Admin dispatches.
4. Backend fetches service and route.
5. Backend creates vehicles and traffic signals.
6. Backend sets incident status to `dispatched`.
7. Backend broadcasts `status_updated`.
8. Admin dashboard updates the map and incident list.

---

## 15. Methodology

### Requirement Analysis

The implementation addresses requirements for:

- Emergency reporting by citizens.
- Sensor alert ingestion.
- Real-time dashboard visibility.
- Role-based user experience.
- Map-based operational awareness.
- Nearby emergency service lookup.
- Dispatch route visualization.

### System Design Methodology

The system is split into independent concerns:

- `accounts` for identity.
- `incidents` for central emergency records and realtime updates.
- `sensors` for IoT ingestion.
- `admin_panel` for operational workflows.
- React pages/components for UI workflows.

### Development Methodology

The code favors pragmatic module-level implementation:

- DRF viewsets for CRUD-style resources.
- Function views for specialized workflows.
- React component state for screen-level orchestration.
- Environment variables for runtime configuration.

### Architecture Methodology

The architecture is a modular monolith backend plus SPA frontend. This is appropriate for a prototype because it keeps deployment and data consistency simple while still modeling real emergency-system boundaries.

### Database Methodology

The database is normalized around core domain entities:

- Users
- Incidents
- Incident images
- Sensor data
- Emergency services
- Vehicles
- Traffic signals

### API Methodology

APIs are RESTful where possible:

- Resource CRUD: incidents.
- Action APIs: login, register, sensor alert, dispatch, nearby services.
- Realtime API: WebSocket events for state changes.

### Security Methodology

Current security foundations:

- JWT authentication.
- Django password hashing.
- Password validation.
- Server-assigned ownership fields.

Production hardening should add explicit admin permissions, sensor authentication, CORS restrictions, throttling, and WebSocket authentication.

### Testing Methodology

No automated tests are currently included. Recommended testing layers:

- Unit tests for serializers and threshold functions.
- API tests for auth, incidents, sensor duplicates, dispatch errors.
- WebSocket tests for broadcast format.
- Frontend component tests for dashboards and modal validation.
- Manual end-to-end tests for citizen report and admin dispatch.

### Deployment Methodology

Current runnable deployment approach:

- Run Django through Daphne for ASGI/WebSocket support.
- Run React development server or build static assets.
- Run MySQL separately.
- Optionally run sensor simulator or UDP receiver as separate processes.

No Docker, Kubernetes, or CI/CD pipeline is present.

---

## 16. Algorithms / Logic Used

### Detection Logic

Sensor scripts detect emergencies using threshold rules:

| Emergency | Logic |
|---|---|
| Accident | Large pitch/roll angle or sudden pitch/roll delta. |
| Gas | MQ2 reading above 650 or gas field not clean. |
| Fire | Flame sensor equals 1 or temperature above 58. |

### Alert Logic

`sensor_alert_view` accepts only:

- `accident`
- `fire`
- `gas`

The alert is converted to:

- `SensorData` record with hardware sensor mapping.
- `Incident` record if not duplicate.

### Duplicate Handling

Duplicate suppression uses:

- Time window: 15 minutes.
- Radius: 0.35 km.
- Same incident type.
- Active statuses: `pending`, `dispatched`, `in_progress`.
- Source: `sensor`.

### Distance Matching

Haversine distance is used for:

- Duplicate sensor incident detection.
- Ranking nearby OSM services.
- Traffic signal red/green simulation.
- Simulated route helpers in `routing_utils.py`.

### Notification Logic

The backend sends:

```json
{
  "event": "new_incident",
  "payload": {}
}
```

or:

```json
{
  "event": "status_updated",
  "payload": {}
}
```

Frontend inserts or replaces incidents by ID:

```javascript
setIncidents((prev) => [payload, ...prev.filter((i) => i.id !== payload.id)]);
```

### Tracking Logic

Route tracking is currently visual rather than live telemetry:

- Dispatch stores route points in frontend `routesByIncident`.
- Vehicle initial location is the first route point.
- No continuous GPS update endpoint is implemented.

### Scheduling Logic

`sensor_server.py` emits a simulated alert every 300 seconds using `time.sleep(300)`.

### AI/ML Algorithms

No AI/ML algorithm is implemented.

---

## 17. Installation Guide

### Prerequisites

- Python 3.10+ recommended.
- Node.js and npm.
- MySQL server.
- C compiler and MySQL development headers if `mysqlclient` needs compilation.
- Git.

### Environment Setup

Create root environment file:

```bash
cp .env.example .env
```

Edit at minimum:

```text
DJANGO_SECRET_KEY=your-secure-secret
MYSQL_DB=smart_city
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
```

For React-specific local config:

```bash
cp frontend/.env.example frontend/.env
```

### Database Setup

Create the MySQL database:

```sql
CREATE DATABASE smart_city CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
```

Run backend with ASGI/WebSocket support:

```bash
daphne -p 8000 smart_city_backend.asgi:application
```

Alternative development HTTP-only run:

```bash
python manage.py runserver 8000
```

Use Daphne when testing WebSockets.

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend development server:

```text
http://localhost:3000
```

### Sensor Simulator Setup

`sensor_server.py` imports Flask, but Flask is not listed in `backend/requirements.txt`. Install it for the simulator:

```bash
pip install flask requests python-dotenv
python sensor_server.py
```

Default simulator health URL:

```text
http://localhost:5050/
```

### UDP Receiver Setup

```bash
pip install requests python-dotenv
python receiver.py
```

Default UDP port:

```text
5005
```

### Running Locally

Use separate terminals:

```bash
# Terminal 1: backend
cd backend
source .venv/bin/activate
daphne -p 8000 smart_city_backend.asgi:application
```

```bash
# Terminal 2: frontend
cd frontend
npm start
```

```bash
# Terminal 3: optional sensor simulator
python sensor_server.py
```

```bash
# Terminal 4: optional UDP receiver
python receiver.py
```

### Production Build

Build React:

```bash
cd frontend
npm run build
```

Backend production considerations:

- Set `DEBUG=0`.
- Set a strong `DJANGO_SECRET_KEY`.
- Restrict `ALLOWED_HOSTS`.
- Restrict CORS origins.
- Serve static and media files properly.
- Run Daphne or another ASGI-capable server behind a reverse proxy.
- Replace in-memory Channels layer with Redis for multi-process/multi-server deployment.

---

## 18. Environment Variables

### Root `.env`

| Variable | Purpose | Required | Example Value |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | Django cryptographic signing secret. | Required in production | `change-me-to-a-long-random-secret` |
| `DEBUG` | Enables Django debug mode when `1`. | Optional | `1` |
| `ALLOWED_HOSTS` | Comma-separated allowed hostnames. | Required in production | `localhost,127.0.0.1` |
| `MYSQL_DB` | MySQL database name. | Required | `smart_city` |
| `MYSQL_USER` | MySQL username. | Required | `root` |
| `MYSQL_PASSWORD` | MySQL password. | Required if database user has password | `your-password` |
| `MYSQL_HOST` | MySQL host. | Required | `127.0.0.1` |
| `MYSQL_PORT` | MySQL port. | Required | `3306` |
| `DJANGO_API_BASE` | General backend base URL. | Optional; not directly used by current Django settings | `http://localhost:8000` |
| `DJANGO_SENSOR_URL` | Sensor alert endpoint for scripts. | Required for scripts | `http://localhost:8000/api/sensor-alert/` |
| `RECEIVER_UDP_PORT` | UDP port for `receiver.py`. | Optional | `5005` |
| `SENSOR_SERVER_HOST` | Flask simulator bind host. | Optional | `0.0.0.0` |
| `SENSOR_SERVER_PORT` | Flask simulator port. | Optional | `5050` |
| `REACT_APP_API_BASE_URL` | React API base URL. | Optional if using frontend `.env` | `http://localhost:8000/api/` |
| `REACT_APP_WS_URL` | React WebSocket URL. | Optional | `ws://localhost:8000/ws/incidents/` |

### Frontend `.env`

| Variable | Purpose | Required | Example Value |
|---|---|---|---|
| `REACT_APP_API_BASE_URL` | Base URL used by Axios. | Optional | `/api/` |
| `REACT_APP_WS_URL` | Explicit WebSocket endpoint. | Optional | `ws://localhost:8000/ws/incidents/` |

---

## 19. Usage Guide

### Citizen Workflow

1. Open the frontend.
2. Register as `citizen` or log in.
3. View the citizen dashboard.
4. Click `Report Incident`.
5. Select emergency type.
6. Add optional description.
7. Use current location or enter coordinates manually.
8. Optionally start camera and capture up to 3 images.
9. Submit the report.
10. The dashboard updates and all connected clients receive the new incident.

### Admin Workflow

1. Register or log in with role `admin`.
2. Open the Admin Control Center.
3. Review incidents under:
   - `upcoming` for pending incidents.
   - `live` for dispatched or in-progress incidents.
   - `completed` for completed incidents.
4. Click an incident card to preview nearby services and route.
5. Click `Dispatch` for pending incidents.
6. View the selected service, route line, traffic signal markers, and status update.

### Emergency Workflow

```text
Incident created
  -> status pending
  -> admin previews nearby service
  -> admin dispatches
  -> status dispatched
  -> vehicle records created
  -> route and traffic signals shown
  -> clients receive realtime update
```

### API Usage

Example login:

```bash
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"StrongPassword123"}'
```

Example sensor alert:

```bash
curl -X POST http://localhost:8000/api/sensor-alert/ \
  -H "Content-Type: application/json" \
  -d '{"type":"fire","value":75,"latitude":12.9716,"longitude":77.5946}'
```

### Testing Workflow

Manual workflow:

1. Start backend with Daphne.
2. Start frontend.
3. Register citizen and admin users.
4. Submit an incident from citizen dashboard.
5. Confirm admin dashboard receives WebSocket update.
6. Preview nearby services.
7. Dispatch incident.
8. Confirm status changes and route appears.
9. Start `sensor_server.py` and confirm periodic sensor incidents.
10. Start `receiver.py` and send UDP JSON packets to test hardware-style ingestion.

---

## 20. Screens / UI Explanation

### Authentication Screen

File: `frontend/src/pages/AuthPage.js`

- Supports login and registration modes.
- Uses email and password for login.
- Registration includes full name and role selection.
- Includes password show/hide toggle.
- Stores token and user on success.

### Citizen Dashboard

File: `frontend/src/pages/CitizenDashboard.js`

- Displays incident cards.
- Shows empty state if no incidents exist.
- Subscribes to incident WebSocket updates.
- Provides floating `Report Incident` button.
- Shows submit success/failure toast.

### Report Incident Modal

File: `frontend/src/components/ReportIncidentModal.js`

- Select incident type.
- Enter description.
- Fetch browser location.
- Manually enter latitude/longitude.
- Start camera.
- Capture up to 3 images.
- Submit report.

### Admin Control Center

File: `frontend/src/pages/AdminDashboard.js`

- Left panel contains incident queues.
- Tabs filter by status:
  - `upcoming`
  - `live`
  - `completed`
- Incident click previews nearby services.
- Dispatch button appears for pending incidents.
- Right panel contains interactive map.

### Map Panel

File: `frontend/src/components/MapPanel.js`

Displays:

- Incident markers.
- Static service markers.
- Nearby service markers.
- Junction circle markers if provided.
- Traffic signal circle markers.
- Active route polylines.
- OpenStreetMap base tiles.

### Incident Card

File: `frontend/src/components/IncidentCard.js`

- Shows uppercase incident type.
- Shows status label.
- Shows description or fallback text.
- Shows dispatch button when handler is provided.

---

## 21. Error Handling Strategy

### Validation

- Registration password validation uses Django validators.
- Sensor alerts use DRF serializer validation for type, value, latitude, and longitude.
- Report modal checks location before submit.
- Auth form displays API error details when available.

### Exception Handling

Implemented:

- `login_view` returns `401` for invalid credentials.
- `sensor_alert_view` returns duplicate response instead of creating repeated incidents.
- `fetch_osm_services` catches failed Overpass endpoint calls and tries alternatives.
- Frontend catches dashboard, incident submit, service preview, and dispatch errors.
- UDP receiver catches parse/forward errors and prints them.

Gaps:

- `nearby_services_view` and `dispatch_view` use `Incident.objects.get` without explicit `DoesNotExist` handling.
- Image base64 decoding does not have explicit exception handling.
- OSRM route failure during dispatch is not wrapped in the same fallback style as route preview.

### API Error Handling

| API | Error Behavior |
|---|---|
| `/api/login/` | `401` with detail on invalid credentials. |
| `/api/register/` | DRF validation errors. |
| `/api/sensor-alert/` | DRF validation errors or duplicate response. |
| `/api/nearby-services/` | `400` if `incident_id` missing. |
| `/api/dispatch/` | `503` if services cannot be fetched. |

### Retry Logic

- Overpass lookup tries multiple endpoints and radii.
- It searches around the incident first and then around a Bengaluru fallback center.
- No retry/backoff exists for frontend API calls.

### Logging System

- Django uses default server logging.
- Sensor scripts use `print`.
- No structured logging, log levels, external monitoring, or tracing are configured.

---

## 22. Testing

No automated test files are present in the repository.

### Unit Testing Recommendations

Recommended targets:

- `RegisterSerializer.create`
- `SensorAlertSerializer`
- `sensor_alert_view` duplicate suppression
- `haversine_km`
- `service_types_for_incident`
- `detect_alert`
- `detect_event`

### Integration Testing Recommendations

Recommended flows:

- Register -> login -> create incident.
- Sensor alert -> incident created -> WebSocket broadcast.
- Duplicate sensor alert -> duplicate response.
- Admin dispatch -> vehicle and signal records created.

### API Testing Recommendations

Use curl, Postman, Insomnia, or DRF API client to test:

- Auth endpoints.
- Protected incident endpoints.
- Public sensor endpoint.
- Dashboard and dispatch endpoints.

### Manual Testing

Manual tests should validate:

- Role-based dashboard rendering.
- Geolocation fallback behavior.
- Camera permission behavior.
- WebSocket update delivery between browser sessions.
- Map marker and route rendering.

### Load Testing

No load testing tooling is present. For production-like evaluation, test:

- Many simultaneous WebSocket clients.
- Burst sensor alerts.
- Overpass/OSRM timeout behavior.
- Large incident table queries.

### Security Testing

Recommended checks:

- JWT-required routes reject unauthenticated users.
- Admin-only actions are blocked for citizens after adding backend role permissions.
- Sensor endpoint cannot be abused after adding device authentication.
- CORS is restricted in production.
- Uploaded images are validated for size and content type.

---

## 23. Deployment

### Hosting Platform

No platform-specific deployment files are present. The app can be deployed on any environment that supports:

- Python/Django ASGI app.
- Node/React static build.
- MySQL.
- WebSocket-capable reverse proxy.

### Build Process

Backend:

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
daphne -p 8000 smart_city_backend.asgi:application
```

Frontend:

```bash
cd frontend
npm install
npm run build
```

### Deployment Pipeline

No CI/CD pipeline is included. A production pipeline should include:

1. Install backend dependencies.
2. Install frontend dependencies.
3. Run backend tests.
4. Run frontend tests/linting when added.
5. Build frontend.
6. Run database migrations.
7. Deploy ASGI backend.
8. Serve static frontend assets.

### Docker/Kubernetes

No Dockerfile, docker-compose file, or Kubernetes manifests are present.

### CI/CD Flow

No `.github/workflows`, `.gitlab-ci.yml`, or Jenkins configuration is present.

### Production Notes

- Replace `InMemoryChannelLayer` with Redis for multi-worker WebSocket support.
- Configure HTTPS for browser camera/geolocation outside localhost.
- Use a reverse proxy such as Nginx or Caddy for TLS and WebSocket forwarding.
- Configure static/media file serving.
- Avoid public OSRM/Overpass overuse in production; use hosted or self-managed services.

---

## 24. Performance Optimization

### Existing Optimizations

| Optimization | Location |
|---|---|
| Sensor duplicate suppression limits active duplicate incidents. | `backend/sensors/views.py`. |
| Incident list ordering by newest first. | `Incident.Meta`. |
| Dashboard limits incidents to latest 100. | `dashboard_view`. |
| Route cache in browser localStorage. | `AdminDashboard.js`. |
| Overpass lookup limits returned services. | `fetch_osm_services`. |

### Caching

No server-side cache is configured. Candidate improvements:

- Cache Overpass service results by incident location/type.
- Cache OSRM route results for repeated incident previews.
- Cache dashboard aggregates for short durations.

### Lazy Loading

No explicit React lazy loading is used. The app is small enough for current scale, but lazy loading can split admin map code if the frontend grows.

### Query Optimization

Current query patterns are simple. Production improvements:

- Add indexes for status, source, type, and timestamps.
- Paginate incident endpoints.
- Avoid loading all incident images when not needed.

### API Optimization

Recommended improvements:

- Add pagination to `IncidentViewSet`.
- Add filtering by status/source/type.
- Add rate limits for sensor and auth endpoints.
- Wrap external API calls with timeout, retry, and circuit breaker patterns.

### Compression

No compression middleware or reverse-proxy compression config is present.

### Rate Limiting

No rate limiting is configured. Sensor and auth endpoints should be throttled before production.

---

## 25. Scalability

### Horizontal Scaling

Current blocker:

- Channels uses `InMemoryChannelLayer`, which works for a single process but does not share WebSocket events across multiple backend workers.

Recommended:

- Use Redis channel layer.
- Run multiple Daphne/Uvicorn workers behind a load balancer.
- Use sticky sessions or proper WebSocket load balancing.

### Vertical Scaling

The current architecture can be vertically scaled by increasing CPU/RAM for:

- Django ASGI server.
- MySQL server.
- React static hosting/reverse proxy.

### Database Scaling

Recommended as data grows:

- Add indexes.
- Add pagination.
- Archive old incidents.
- Consider spatial indexes or PostGIS-like capabilities if moving to PostgreSQL.
- Use read replicas for heavy dashboard/reporting workloads.

### Service Scaling

External service calls should be isolated for production:

- Self-host OSRM or use a paid routing service.
- Use controlled Overpass instances or preloaded emergency service database.
- Run sensor ingestion as a separate worker service if alert volume grows.

### Queue Systems

No queue is currently implemented. Useful future queues:

- Celery/RQ for external API lookup.
- Queue sensor events for burst handling.
- Background task to update vehicle GPS positions.

---

## 26. Future Enhancements

1. Add explicit backend admin permission classes for admin-only endpoints.
2. Add API keys or signed requests for sensor devices.
3. Replace in-memory Channels with Redis.
4. Add pagination and filtering for incidents.
5. Add status transition rules, such as pending -> dispatched -> in_progress -> completed.
6. Add responder live GPS updates.
7. Add SMS/push/email notification integrations.
8. Add proper traffic signal control simulation or integration.
9. Add service database seeding and fallback when Overpass is unavailable.
10. Add automated unit, integration, and WebSocket tests.
11. Add Docker Compose for Django, MySQL, Redis, frontend, and sensor services.
12. Add CI/CD pipeline.
13. Add uploaded image validation, compression, and size limits.
14. Add audit logs for dispatch and status changes.
15. Add map clustering for high incident density.
16. Add role management and admin approval for new admin users.
17. Add incident severity scoring.
18. Add offline reporting support for citizens.
19. Add analytics dashboard for incident trends.
20. Add production observability: structured logs, metrics, tracing, and alerts.

---

## 27. Challenges Faced

The architecture and implementation imply several practical challenges:

- **Realtime consistency:** Keeping citizen and admin dashboards synchronized required WebSocket broadcasting after creation and status changes.
- **Duplicate sensor alerts:** Sensor readings can repeatedly trigger the same event, so radius/time suppression was introduced.
- **Browser capability differences:** Camera and geolocation APIs require permission handling and may fail outside HTTPS or localhost.
- **External geospatial reliability:** Overpass and OSRM can time out or fail, requiring fallback endpoints and error messages.
- **Role separation:** Frontend role routing exists, but backend admin authorization needs stronger enforcement for production.
- **Image handling:** Base64 browser captures must be decoded and saved through Django media storage.
- **Single-process WebSocket limitation:** In-memory Channels works locally but must change for scalable deployment.
- **Emergency service filtering:** OSM data contains clinics and diagnostic centers, so hospital filtering was added to reduce irrelevant results.

---

## 28. Learning Outcomes

Developers studying this project can learn:

- How to build a Django REST Framework backend with a custom user model.
- How to implement JWT login and registration using Simple JWT.
- How to connect React to protected APIs through Axios.
- How to persist auth state in a SPA.
- How to build role-based dashboard rendering.
- How to use Django Channels for WebSocket broadcasts.
- How to integrate browser camera and geolocation APIs.
- How to save base64 camera captures as Django image files.
- How to ingest sensor alerts from HTTP and UDP sources.
- How to apply Haversine distance for location-aware emergency logic.
- How to use Overpass API for OpenStreetMap place discovery.
- How to use OSRM for route geometry.
- How to visualize incidents, routes, and services with Leaflet.
- How to structure a smart-city prototype around modular backend apps.

---

## 29. Conclusion

Smart Emergency Detection and Response System is a practical smart-city emergency prototype that combines citizen reporting, sensor-triggered alerts, real-time incident updates, map visualization, and dispatch routing. The project demonstrates an end-to-end emergency workflow across React, Django REST Framework, MySQL, Django Channels, Leaflet, OpenStreetMap, Overpass, and OSRM.

The implementation is strongest as a local or academic prototype and already contains the core concepts needed for a production emergency platform. With stronger backend authorization, device authentication, Redis-backed WebSockets, automated tests, deployment automation, and production observability, it can evolve into a more robust emergency response coordination system.

---

## 30. Contributors Section

| Name | Role | Contribution |
|---|---|---|
| Project Maintainer | Full-stack developer | Backend, frontend, sensor integration, emergency workflow. |
| Contributor 1 | Backend developer | Add permissions, tests, and deployment improvements. |
| Contributor 2 | Frontend developer | Improve UI, accessibility, and map workflows. |
| Contributor 3 | IoT developer | Integrate real sensor hardware and secure device authentication. |

To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes.
4. Add tests where applicable.
5. Open a pull request with a clear summary.

---

## 31. License Section

This project does not currently include a committed license file.

Recommended placeholder:

```text
MIT License

Copyright (c) 2026 Project Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files, to deal in the Software
without restriction, subject to the full MIT License text.
```

Before publishing or distributing the project, add a complete `LICENSE` file and confirm the intended license with all contributors.
