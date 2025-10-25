# import os

# print("Credentials path:", os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))

from google.cloud import vision
import io
import cv2
import os
from google.oauth2 import service_account

credentials = service_account.Credentials.from_service_account_file(
    "C:\\Users\\rohan\\Downloads\\double-fusion-434202-n8-28b6e48de414.json"
)

# Initialize Vision client
client = vision.ImageAnnotatorClient(credentials=credentials)

# Path to your image
image_path = "a-wholesome-journey.png"

# Read image
with io.open(image_path, "rb") as image_file:
    content = image_file.read()

image = vision.Image(content=content)

# Detect objects
response = client.object_localization(image=image)
objects = response.localized_object_annotations

# Load image using OpenCV
cv_image = cv2.imread(image_path)
h, w, _ = cv_image.shape

print(f"Found {len(objects)} objects in the image.")

# Create output folder
os.makedirs("objects", exist_ok=True)

# Loop through detected objects
for i, obj in enumerate(objects):
    # Normalized coordinates (values 0–1)
    vertices = obj.bounding_poly.normalized_vertices

    # Convert to pixel coordinates
    x_min = int(vertices[0].x * w)
    y_min = int(vertices[0].y * h)
    x_max = int(vertices[2].x * w)
    y_max = int(vertices[2].y * h)

    # Crop the object
    cropped = cv_image[y_min:y_max, x_min:x_max]

    # Save cropped image
    output_path = os.path.join("objects", f"object_{i+1}_{obj.name}.jpg")
    cv2.imwrite(output_path, cropped)

    print(f"Saved {output_path} ({obj.name}, confidence: {obj.score*100:.2f}%)")

# Handle API errors
if response.error.message:
    raise Exception(response.error.message)