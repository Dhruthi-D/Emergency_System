# Smart Emergency Detection and Response System

Full local stack:
- `backend/` -> Django + DRF + MySQL + JWT + Channels
- `frontend/` -> React dashboard (inline styles, dark UI, Leaflet static coordinate plotting)
- `sensor_server.py` -> Flask sensor simulator (continuous loop + threshold posting)
- `receiver.py` -> UDP receiver that forwards threshold-triggered sensor alerts to Django

## Environment variables (`.env`)

1. Copy the template: `cp .env.example .env` (repository root).
2. Edit `.env`: set **`MYSQL_PASSWORD`**, **`DJANGO_SECRET_KEY`**, and URLs if ports differ.

Django loads **`idp_new/.env`** automatically (via `python-dotenv`). `receiver.py`, `sensor_server.py`, and the React app read the same values where applicable.

- Frontend: **`frontend/.env`** uses `REACT_APP_*` (copy from `frontend/.env.example` if you remove `frontend/.env`). Restart `npm start` after edits.

`.env` at the repo root is listed in `.gitignore` so secrets are not committed; use `.env.example` in version control.

## 1) Backend setup (Django)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create MySQL DB:

```sql
CREATE DATABASE smart_city CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run migrations and server:

```bash
python3 manage.py makemigrations
python3 manage.py migrate
daphne -p 8000 smart_city_backend.asgi:application
```

## 2) Frontend setup (React)

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000`.

## 3) Sensor server setup (Flask)

Install deps:

```bash
pip install flask requests python-dotenv
```

Run simulator:

```bash
python3 sensor_server.py
```

Sensor server continuously generates random sensor values and sends `POST /api/sensor-alert/` only when thresholds are triggered.

## 4) Optional UDP receiver flow

Your existing `receiver.py` listens for UDP data and forwards sensor alerts to:

`http://localhost:8000/api/sensor-alert/`

Run:

```bash
python3 receiver.py
```

The `KeyboardInterrupt` shown in your screenshot is expected when you manually stop the process with `Ctrl+C`.

## Implemented API endpoints

- `POST /api/register/`
- `POST /api/login/`
- `POST /api/incidents/`
- `GET /api/incidents/`
- `GET /api/incidents/<id>/`
- `PATCH /api/incidents/<id>/`
- `POST /api/sensor-alert/`
- `GET /api/dashboard/`
- `POST /api/dispatch/`

## Routing implementation details

- No external routing APIs
- No Dijkstra/OSM parsing
- Route generation uses:
  - Nearest service via Haversine
  - Predefined Bengaluru junctions
  - Service -> nearest junction -> intermediate junctions -> incident
  - Segment interpolation + slight curve offset for road-like path

## Real-time updates

WebSocket endpoint:

- `ws://localhost:8000/ws/incidents/`

Broadcast events:
- New incident
- Status update
# Emergency_System
