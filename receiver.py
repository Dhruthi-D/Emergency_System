import json
import os
import socket
from datetime import datetime
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

try:
    import requests
except ImportError:
    requests = None

if load_dotenv:
    load_dotenv(Path(__file__).resolve().parent / ".env")

PORT = int(os.getenv("RECEIVER_UDP_PORT", "5005"))
DJANGO_SENSOR_URL = os.getenv("DJANGO_SENSOR_URL", "http://localhost:8000/api/sensor-alert/")
last_pitch = None
last_roll = None


def detect_alert(payload):
    global last_pitch, last_roll
    gas = payload.get("gas", "Clean")
    mq2 = float(payload.get("mq2", 0) or 0)
    flame = int(payload.get("flame", 0) or 0)
    temperature = float(payload.get("temp", payload.get("temperature", 0)) or 0)
    pitch = float(payload.get("pitch", 0) or 0)
    roll = float(payload.get("roll", 0) or 0)

    accident = False
    if last_pitch is not None and last_roll is not None:
        accident = abs(pitch - last_pitch) > 28 or abs(roll - last_roll) > 28
    accident = accident or abs(pitch) > 55 or abs(roll) > 55
    last_pitch = pitch
    last_roll = roll

    if accident:
        return "accident", max(abs(pitch), abs(roll))
    if str(gas).lower() not in ["clean", "normal", "0"] or mq2 > 650:
        return "gas", mq2 or 1
    if flame == 1 or temperature > 58:
        return "fire", max(temperature, flame)
    return None, None


def maybe_forward(message):
    if requests is None:
        return
    try:
        timestamp, raw_json = message.split(",", 1)
        payload = json.loads(raw_json)
        alert_type, value = detect_alert(payload)
        if not alert_type:
            return
        alert = {
            "type": alert_type,
            "value": value,
            "latitude": payload.get("lat", payload.get("latitude", 12.9716)),
            "longitude": payload.get("lng", payload.get("longitude", 77.5946)),
        }
        response = requests.post(DJANGO_SENSOR_URL, json=alert, timeout=5)
        response.raise_for_status()
        print("Forwarded alert:", alert)
    except Exception as exc:
        print("Forward failed:", exc)

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind(("0.0.0.0", PORT))

print("Listening for data...")

try:
    while True:
        data, addr = sock.recvfrom(1024)
        message = data.decode()

        print("Received:", message)
        maybe_forward(message)
except KeyboardInterrupt:
    print("\nReceiver stopped by user.")
