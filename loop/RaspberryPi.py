import os
import time
import cv2
import boto3
import json
import RPi.GPIO as GPIO
import logging
import re
from datetime import datetime
from zoneinfo import ZoneInfo
from picamzero import Camera
from awscrt import io, mqtt
from awsiot import mqtt_connection_builder
from dotenv import load_dotenv

# --------------------- Logging Configuration ---------------------
load_dotenv()
logging.getLogger('boto3').setLevel(logging.CRITICAL)
logging.getLogger('botocore').setLevel(logging.CRITICAL)
io.init_logging(getattr(io.LogLevel, io.LogLevel.Error.name), 'stderr')

# --------------------- Directories ---------------------
BASE_DIR = "./images"
os.makedirs(f"{BASE_DIR}/full", exist_ok=True)
os.makedirs(f"{BASE_DIR}/left", exist_ok=True)
os.makedirs(f"{BASE_DIR}/right", exist_ok=True)
camera = Camera()

# --------------------- GPIO Configuration ---------------------
sensor1_pin = 23
led1_pin = 26
sensor2_pin = 24
led2_pin = 19

sensors = {
    "left": {
        "pin": sensor1_pin,
        "led": led1_pin,
        "detected": False,
        "lot_occupied": False,
        "consecutive_detect": 0,
        "consecutive_no_detect": 0,  # Initialize no detect counter
    },
    "right": {
        "pin": sensor2_pin,
        "led": led2_pin,
        "detected": False,
        "lot_occupied": False,
        "consecutive_detect": 0,
        "consecutive_no_detect": 0,  # Initialize no detect counter
    },
}
# --------------------- AWS Configurations ---------------------

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")  # Default to us-east-1 if not set

textract_client = boto3.client(
    'textract',
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

PATH_TO_CERT = "./certificates/device-certificate.pem.crt"
PATH_TO_KEY = "./certificates/private.pem.key"
PATH_TO_ROOT = "./certificates/AmazonRootCA1.pem"

# MQTT Configurations (Loaded from Environment)
ENDPOINT = os.getenv("MQTT_ENDPOINT")
CLIENT_ID = os.getenv("MQTT_CLIENT_ID", "FindMyCarDevice")
TOPIC = os.getenv("MQTT_TOPIC", "findmycar/data")
DEVICE_ID = os.getenv("DEVICE_ID", "DEVICE001")
PARKING_SPOT_ID = os.getenv("PARKING_SPOT_ID", "SPOT001")
singapore_tz = ZoneInfo("Asia/Singapore")

# --------------------- MQTT Initialization ---------------------
event_loop_group = io.EventLoopGroup(1)
host_resolver = io.DefaultHostResolver(event_loop_group)
client_bootstrap = io.ClientBootstrap(event_loop_group, host_resolver)
mqtt_connection = mqtt_connection_builder.mtls_from_path(
    endpoint=ENDPOINT,
    port=8883,
    cert_filepath=PATH_TO_CERT,
    pri_key_filepath=PATH_TO_KEY,
    client_bootstrap=client_bootstrap,
    ca_filepath=PATH_TO_ROOT,
    client_id=CLIENT_ID,
    clean_session=False,
    keep_alive_secs=6
)

# --------------------- Helper Functions ---------------------
def human_readable_timestamp():
    return datetime.now(singapore_tz).strftime("%Y-%m-%d %H:%M:%S")

def get_parking_spot_id(lot_detected):
    """Returns the parking spot ID based on the detected lot."""
    if lot_detected == "left":
        return parking_spot_ids.get("left", "SPOT_LEFT_001")
    elif lot_detected == "right":
        return parking_spot_ids.get("right", "SPOT_RIGHT_002")
    else:
        return "SPOT_UNKNOWN"

def init_message(parking_spot_id, device_id, status, plate_number):
    """Initializes the MQTT message."""
    return {
        "parking_spot_id": parking_spot_id,
        "device_id": device_id,
        "status": status,
        "plate_number": plate_number,
        "timestamp": human_readable_timestamp()
    }

def upload_image_to_textract(file_path):
    with open(file_path, 'rb') as document:
        response = textract_client.analyze_document(
            Document={'Bytes': document.read()},
            FeatureTypes=["TABLES", "FORMS"]
        )
    extracted_text = " ".join(block['Text'] for block in response['Blocks'] if block['BlockType'] == 'LINE').strip()
    print(f"Received response from AWS Textract: {extracted_text}")
    return extracted_text

def publish_message(message, spot_id):
    topic_with_spot = f"findmycar/{spot_id}/data"
    mqtt_connection.publish(
        topic=topic_with_spot,
        payload=json.dumps(message),
        qos=mqtt.QoS.AT_LEAST_ONCE
    )
    print("Message published to MQTT broker.")

def capture_and_process_image(lot_detected):
    """
    Captures and processes an image, extracting the bottom-left or bottom-right quarter based on the detected lot.
    Args:
        lot_detected (str): The parking lot being processed ("left" or "right").
    Returns:
        str: Path to the processed image.
    """
    timestamp = time.strftime("%Y-%m-%d_%H-%M-%S")
    full_image_path = f"{BASE_DIR}/full/{timestamp}_full.jpg"
    relevant_image_path = f"{BASE_DIR}/{lot_detected}/{timestamp}_{lot_detected}.jpg"

    # Capture the full image
    camera.take_photo(full_image_path)
    print("Image captured.")
    image = cv2.imread(full_image_path)
    if image is None:
        return None

    # Get image dimensions
    height, width, _ = image.shape

    # Segment the image based on the lot
    if lot_detected == "left":
        relevant_image = image[height // 2:, :width // 2]  # Bottom-left quarter
    elif lot_detected == "right":
        relevant_image = image[height // 2:, width // 2:]  # Bottom-right quarter
    else:
        print(f"Unknown lot detected: {lot_detected}")
        return None

    # Save and return the processed image path
    cv2.imwrite(relevant_image_path, relevant_image)
    print(f"Segmented image saved: {relevant_image_path}")
    return relevant_image_path

def capture_and_process_setup_image():
    """
    Captures an image for setup, segments it into top-left and top-right quarters,
    uploads them to Textract, and returns the detected text.
    Returns:
        dict: A dictionary with detected texts for 'left' and 'right'.
    """
    print("Setting up custom parking spot IDs...")
    for i in range(3, 0, -1):
        print(f"Taking picture in {i}...")
        time.sleep(1)

    timestamp = time.strftime("%Y-%m-%d_%H-%M-%S")
    full_image_path = f"{BASE_DIR}/setup/{timestamp}_setup_full.jpg"
    os.makedirs(f"{BASE_DIR}/setup", exist_ok=True)

    # Capture the full image
    camera.take_photo(full_image_path)
    print("Setup image captured.")
    image = cv2.imread(full_image_path)
    if image is None:
        print("Failed to capture image for setup.")
        return None

    # Get image dimensions
    height, width, _ = image.shape

    # Segment the image into top-left and top-right quarters
    segments = {}
    segments_paths = {}
    segments['left'] = image[:height,:width // 2]  # Top-left quarter
    segments['right'] = image[:height, width // 2:]  # Top-right quarter

    detected_texts = {}
    for side in ['left', 'right']:
        segment_path = f"{BASE_DIR}/setup/{timestamp}_setup_{side}.jpg"
        cv2.imwrite(segment_path, segments[side])
        segments_paths[side] = segment_path
        print(f"Segmented {side} image saved: {segment_path}")

        # Upload to Textract
        print(f"Uploading {side} segment to AWS Textract...")
        text = upload_image_to_textract(segment_path)
        detected_texts[side] = text

    return detected_texts

# --------------------- GPIO Setup ---------------------
def setup_gpio():
    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)
    for sensor in sensors.values():
        GPIO.setup(sensor["pin"], GPIO.IN)
        GPIO.setup(sensor["led"], GPIO.OUT)

def detect_car(sensor_data, lot):
    """
    Check for car detection based on sensor input.
    Args:
        sensor_data (dict): The sensor configuration and state.
        lot (str): The lot being processed ("left" or "right").
    """
    sensor_input = GPIO.input(sensor_data["pin"])
    if sensor_input == GPIO.LOW:  # Object detected
        GPIO.output(sensor_data["led"], True)  # Turn on LED
        sensor_data["consecutive_no_detect"] = 0

        if sensor_data["detected"]:
            sensor_data["consecutive_detect"] += 1
        else:
            sensor_data["consecutive_detect"] = 1
            print(f"[Info] Something detected in {lot.capitalize()} Lot.")

        sensor_data["detected"] = True

        # Check if detection threshold is met
        if sensor_data["consecutive_detect"] >= 2:  # Adjust threshold as needed
            if not sensor_data["lot_occupied"]:  # Only trigger if not already occupied
                sensor_data["lot_occupied"] = True  # Mark lot as occupied
                print(f"[Action] A car is detected and parked in {lot.capitalize()} Lot.")
                handle_car_parked(sensor_data, lot)
    else:  # No object detected
        GPIO.output(sensor_data["led"], False)  # Turn off LED
        sensor_data["consecutive_detect"] = 0

        if not sensor_data["detected"]:
            sensor_data["consecutive_no_detect"] += 1

        sensor_data["detected"] = False

        # Check if departure threshold is met
        if sensor_data["consecutive_no_detect"] >= 2:  # Adjust threshold as needed
            if sensor_data["lot_occupied"]:  # Only trigger if lot was occupied
                sensor_data["lot_occupied"] = False  # Mark lot as no longer occupied
                print(f"[Action] A car has left the {lot.capitalize()} Lot.")
                handle_car_departure(sensor_data, lot)
                reset_counters(sensor_data, lot)

def monitor_parking_lots():
    """Monitors parking lots for vehicle presence using the updated counter logic."""
    print("[System] System live. Monitoring parking lots...")
    while True:
        for lot, data in sensors.items():
            detect_car(data, lot)
        time.sleep(2)

def validate_license_plate(plate_number):
    """
    Validates a Singapore vehicle registration number.
    Args:
        plate_number (str): The extracted license plate number.
    Returns:
        bool: True if the plate is valid, False otherwise.
    """
    # Regex pattern for Singapore license plate
    pattern = r"^S[A-HJ-Z]{2} [1-9][0-9]{0,3} [A-HJ-KM-UY-Z]$"
    
    # Check if the plate matches the pattern
    if re.match(pattern, plate_number):
        print(f"[Validation] License plate '{plate_number}' is valid.")
        return True
    else:
        print(f"[Validation] License plate '{plate_number}' is invalid. Uploading it anyway.")
        return False

def handle_car_parked(sensor_data, lot):
    """
    Handles actions when a car is confirmed parked.
    Args:
        sensor_data (dict): The sensor configuration and state.
        lot (str): The lot being processed ("left" or "right").
    """
    parking_spot_id = get_parking_spot_id(lot)
    image_path = capture_and_process_image(lot)
    if image_path:
        print(f"[AWS] Uploading image for {parking_spot_id} to Textract...")
        plate_number = upload_image_to_textract(image_path)
        is_valid = validate_license_plate(plate_number)
        message = init_message(parking_spot_id, DEVICE_ID, 'occupied', plate_number)
        publish_message(message, parking_spot_id)
        print(f"[MQTT] Parking data published for {parking_spot_id}.")

def handle_car_departure(sensor_data, lot):
    """
    Handles actions when a car departs.
    Args:
        sensor_data (dict): The sensor configuration and state.
        lot (str): The lot being processed ("left" or "right").
    """
    parking_spot_id = get_parking_spot_id(lot)
    message = init_message(parking_spot_id, DEVICE_ID, 'empty', "")
    publish_message(message, parking_spot_id)
    print(f"[MQTT] Departure data published for {parking_spot_id}.")

def reset_counters(sensor_data, lot):
    """
    Resets detection counters for stability.
    Args:
        sensor_data (dict): The sensor configuration and state.
        lot (str): The lot being processed ("left" or "right").
    """
    print(f"[Reset] Resetting detection counters for {lot.capitalize()} Lot.")
    sensor_data["consecutive_detect"] = 0
    sensor_data["consecutive_no_detect"] = 0

def run_option_2_setup():
    """
    Executes Option 2: Custom parking spot IDs setup.
    """
    detected_texts = capture_and_process_setup_image()
    if detected_texts:
        print("Detected texts for parking spots:")
        for side, text in detected_texts.items():
            print(f" - {side.capitalize()} spot ID: {text}")
            parking_spot_ids[side] = text
    else:
        print("Setup failed. Using default parking spot IDs.")

# Global variable to store parking spot IDs
parking_spot_ids = {
    "left": "SPOT_LEFT_001",
    "right": "SPOT_RIGHT_002"
}

# --------------------- Main ---------------------
if __name__ == "__main__":
    try:
        mqtt_connection.connect().result()
        setup_gpio()
        print("System started successfully.")

        # Menu at startup
        print("Select an option:")
        print("1. Use default parking spot values")
        print("2. Set custom parking spot values")
        choice = input("Enter your choice (1 or 2): ")

        if choice == '2':
            run_option_2_setup()
        else:
            print("Using default parking spot values.")

        monitor_parking_lots()
    except KeyboardInterrupt:
        GPIO.cleanup()
        mqtt_connection.disconnect().result()
