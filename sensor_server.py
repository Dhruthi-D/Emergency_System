import os
import random
import threading
import time
from pathlib import Path

import requests
from flask import Flask, jsonify

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

if load_dotenv:
    load_dotenv(Path(__file__).resolve().parent / ".env")

app = Flask(__name__)
DJANGO_SENSOR_URL = os.getenv("DJANGO_SENSOR_URL", "http://localhost:8000/api/sensor-alert/")
SENSOR_SERVER_HOST = os.getenv("SENSOR_SERVER_HOST", "0.0.0.0")
SENSOR_SERVER_PORT = int(os.getenv("SENSOR_SERVER_PORT", "5050"))

BENGALURU_POINTS = [
    (12.9716, 77.5946),
    (12.9171, 77.6229),
    (12.9591, 77.6974),
    (13.0352, 77.5970),
]


def random_sensor_packet():
    lat, lng = random.choice(BENGALURU_POINTS)
    return {
        "pitch": random.uniform(-80, 80),
        "roll": random.uniform(-80, 80),
        "mq2": random.uniform(100, 900),
        "flame": random.choice([0, 0, 0, 1]),
        "temperature": random.uniform(25, 85),
        "latitude": lat + random.uniform(-0.01, 0.01),
        "longitude": lng + random.uniform(-0.01, 0.01),
    }


def detect_event(sensor):
    if abs(sensor["pitch"]) > 55 or abs(sensor["roll"]) > 55:
        return "accident", max(abs(sensor["pitch"]), abs(sensor["roll"]))
    if sensor["mq2"] > 650:
        return "gas", sensor["mq2"]
    if sensor["flame"] == 1 or sensor["temperature"] > 58:
        return "fire", max(sensor["temperature"], sensor["flame"])
    return None, None


def loop_sender():
    while True:
        # Simulation mode: emit ONE incident every 5 minutes so UI always has activity.
        packet = random_sensor_packet()
        event_type = random.choice(["accident", "gas", "fire"])
        value = {
            "accident": random.uniform(55, 85),
            "gas": random.uniform(650, 900),
            "fire": random.uniform(58, 90),
        }[event_type]
        payload = {
            "type": event_type,
            "value": round(float(value), 2),
            "latitude": packet["latitude"],
            "longitude": packet["longitude"],
        }
        try:
            requests.post(DJANGO_SENSOR_URL, json=payload, timeout=5)
            print("Simulated alert sent:", payload)
        except Exception as exc:
            print("Alert send failed:", exc)
        time.sleep(300)


@app.get("/")
def health():
    return jsonify({"status": "sensor_server_running"})


if __name__ == "__main__":
    threading.Thread(target=loop_sender, daemon=True).start()
    app.run(host=SENSOR_SERVER_HOST, port=SENSOR_SERVER_PORT, debug=False)
