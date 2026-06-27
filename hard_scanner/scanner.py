import cv2
import numpy as np
import requests
import json
import base64
import time
import csv
import os
import configparser
from datetime import datetime
from pyzbar.pyzbar import decode

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.ini")


def load_config():
    config = configparser.ConfigParser()
    config.read(CONFIG_PATH)

    return {
        "api_url": os.environ.get("API_URL") or config.get("server", "api_url", fallback="http://localhost:5000/api"),
        "email": os.environ.get("DRIVER_EMAIL") or config.get("driver", "email", fallback=""),
        "password": os.environ.get("DRIVER_PASSWORD") or config.get("driver", "password", fallback=""),
        "camera_id": int(os.environ.get("CAMERA_ID") or config.get("scanner", "camera_id", fallback="0")),
        "frame_width": int(config.get("scanner", "frame_width", fallback="1280")),
        "frame_height": int(config.get("scanner", "frame_height", fallback="720")),
        "cooldown": float(config.get("scanner", "scan_cooldown", fallback="2.0")),
        "log_file": os.environ.get("LOG_FILE") or config.get("logging", "log_file", fallback="scan_log.csv"),
    }


def beep():
    try:
        import winsound
        winsound.Beep(1000, 200)
    except Exception:
        print("\a")


def login(cfg):
    url = f"{cfg['api_url']}/auth/login"
    try:
        resp = requests.post(url, json={
            "email": cfg["email"],
            "password": cfg["password"]
        }, timeout=10)
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return None
        data = resp.json()
        print(f"Logged in as {data.get('user', {}).get('name', 'driver')}")
        return data.get("token")
    except requests.exceptions.ConnectionError:
        print(f"Cannot connect to {cfg['api_url']}")
        return None
    except Exception as e:
        print(f"Login error: {e}")
        return None


def verify_ticket(token, api_url, qr_data):
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{api_url}/tickets/verify"
    try:
        resp = requests.post(url, json={"qrData": qr_data}, headers=headers, timeout=10)
        return resp.json()
    except Exception as e:
        return {"valid": False, "error": str(e)}


def decode_qr_data(raw):
    try:
        parsed = json.loads(raw)
        return parsed, raw
    except json.JSONDecodeError:
        pass
    try:
        decoded = base64.b64decode(raw).decode("utf-8")
        return json.loads(decoded), raw
    except Exception:
        return None, raw


def log_scan(log_file, ticket_id, result):
    file_exists = os.path.isfile(log_file)
    with open(log_file, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["timestamp", "ticket_id", "valid", "passenger", "fare", "error"])
        writer.writerow([
            datetime.now().isoformat(),
            ticket_id or "",
            result.get("valid", False),
            result.get("ticket", {}).get("passengerName", ""),
            result.get("ticket", {}).get("fare", ""),
            result.get("error", "")
        ])


def draw_overlay(frame, status, message, stats):
    overlay = frame.copy()
    h, w = frame.shape[:2]

    if status == "valid":
        bg_color = (0, 100, 0)
    elif status == "invalid":
        bg_color = (0, 0, 100)
    else:
        bg_color = (100, 100, 100)

    cv2.rectangle(overlay, (0, 0), (w, h), bg_color, -1)
    cv2.addWeighted(overlay, 0.25, frame, 0.75, 0, frame)

    if status:
        label = "VALID" if status == "valid" else "INVALID"
        label_color = (0, 255, 0) if status == "valid" else (0, 0, 255)
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 2, 4)
        cv2.putText(frame, label, (w // 2 - tw // 2, h // 2 - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 2, label_color, 4)

    if message:
        cv2.putText(frame, message[:60], (20, h - 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    info_text = f"Scanned: {stats['scanned']} | Valid: {stats['valid']} | Invalid: {stats['invalid']}"
    cv2.putText(frame, info_text, (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2)
    cv2.putText(frame, "Press ESC to exit", (20, h - 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 150), 1)

    if status == "waiting":
        cv2.putText(frame, "Waiting for QR code...", (w // 2 - 140, h // 2 + 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (200, 200, 200), 2)


def main():
    cfg = load_config()

    if not cfg["email"] or not cfg["password"]:
        print("Error: Driver credentials not configured.")
        print("Set them in config.ini or via environment variables:")
        print("  DRIVER_EMAIL / DRIVER_PASSWORD")
        return

    token = login(cfg)
    if not token:
        return

    cap = cv2.VideoCapture(cfg["camera_id"])
    if not cap.isOpened():
        print(f"Cannot open camera #{cfg['camera_id']}")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, cfg["frame_width"])
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, cfg["frame_height"])

    stats = {"scanned": 0, "valid": 0, "invalid": 0}
    status = "waiting"
    message = ""
    last_scan_time = 0
    cooldown = cfg["cooldown"]

    print("Hardware QR scanner ready.")
    print(f"Camera: #{cfg['camera_id']} | API: {cfg['api_url']}")
    print("Press ESC to exit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        qrcodes = decode(gray)

        current_time = time.time()
        detected = False

        for qr in qrcodes:
            if qr.type == "QRCODE" and (current_time - last_scan_time) > cooldown:
                raw_value = qr.data.decode("utf-8")
                points = qr.polygon
                if len(points) == 4:
                    pts = [(p.x, p.y) for p in points]
                    pts = np.array(pts, np.int32).reshape((-1, 1, 2))
                    cv2.polylines(frame, [pts], True, (0, 255, 0), 3)

                decoded, original = decode_qr_data(raw_value)
                result = verify_ticket(token, cfg["api_url"], original)

                stats["scanned"] += 1
                if result.get("valid"):
                    stats["valid"] += 1
                    status = "valid"
                    message = f"Passenger: {result.get('ticket', {}).get('passengerName', 'N/A')}"
                    beep()
                else:
                    stats["invalid"] += 1
                    status = "invalid"
                    message = result.get("error", "Invalid ticket")

                ticket_id = decoded.get("ticketId", "") if isinstance(decoded, dict) else ""
                log_scan(cfg["log_file"], ticket_id, result)

                last_scan_time = current_time
                detected = True
                break

        if not detected and (current_time - last_scan_time) > cooldown:
            status = "waiting"
            message = ""

        draw_overlay(frame, status, message, stats)
        cv2.imshow("Smart E-Bus QR Scanner", frame)

        if cv2.waitKey(1) & 0xFF == 27:
            break

    cap.release()
    cv2.destroyAllWindows()
    print(f"\nSession summary:")
    print(f"  Total scanned: {stats['scanned']}")
    print(f"  Valid: {stats['valid']}")
    print(f"  Invalid: {stats['invalid']}")
    print(f"  Log saved to: {cfg['log_file']}")


if __name__ == "__main__":
    main()
