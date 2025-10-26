# import cv2
# import numpy as np
# import os
# from sklearn.cluster import KMeans

# # -------------------------------
# # 1️⃣ Load image
# # -------------------------------
# image_path = "HackOHI-O-2025\\app\\backend\\objects\\object_1_Person.jpg"
# image = cv2.imread(image_path)
# h, w, _ = image.shape

# min_area = 500

# # -------------------------------
# # 2️⃣ Reshape image for clustering
# # -------------------------------
# # Flatten image to a 2D array of pixels
# pixels = image.reshape((-1, 3))

# # Number of dominant colors to find
# num_colors = 11  # adjust as needed

# # -------------------------------
# # 3️⃣ Apply KMeans to find dominant colors
# # -------------------------------
# kmeans = KMeans(n_clusters=num_colors, random_state=42)
# kmeans.fit(pixels)
# colors = np.array(kmeans.cluster_centers_, dtype=np.uint8)

# print("Dominant colors (BGR):", colors)

# # -------------------------------
# # 4️⃣ Create folders to save regions
# # -------------------------------
# output_dir = "color_regions"
# os.makedirs(output_dir, exist_ok=True)

# # -------------------------------
# # 5️⃣ Extract regions for each color
# # -------------------------------
# for idx, color in enumerate(colors):
#     # Create mask for this color
#     lower = np.maximum(color - 60, 0)   # allow some tolerance
#     upper = np.minimum(color + 60, 255)
#     mask = cv2.inRange(image, lower, upper)

#     # Apply morphological operations
#     kernel = np.ones((5, 5), np.uint8)
#     mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)  # merge small holes
#     mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)   # remove small noise


#     # Find contours of regions
#     contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

#     # Folder for this color
#     color_folder = os.path.join(output_dir, f"color_{idx+1}")
#     os.makedirs(color_folder, exist_ok=True)

#     # Crop and save each region
#     for i, contour in enumerate(contours):
#         x, y, w_box, h_box = cv2.boundingRect(contour)
#         if cv2.contourArea(contour) < min_area:
#           continue  # skip tiny regions
#         cropped = image[y:y+h_box, x:x+w_box]
#         cv2.imwrite(os.path.join(color_folder, f"region_{i+1}.jpg"), cropped)

#     print(f"Saved {len(contours)} regions for color {idx+1}")

# print("Done! Check the 'color_regions' folder.")

import cv2
import numpy as np
import os
from sklearn.cluster import KMeans

# -------------------------------
# 1️⃣ Load image
# -------------------------------
image_path = "C:\\Users\\rohan\\VS_code\\rohan\\python\\hack-ohio-2025\\HackOHI-O-2025\\app\\backend\\objects\\object_1_Person.jpg"
image = cv2.imread(image_path)
h, w, _ = image.shape

# -------------------------------
# 2️⃣ Reshape image for KMeans clustering
# -------------------------------
pixels = image.reshape((-1, 3))

# Number of dominant colors to find
num_colors = 5  # adjust as needed

kmeans = KMeans(n_clusters=num_colors, random_state=42)
kmeans.fit(pixels)
colors = np.array(kmeans.cluster_centers_, dtype=np.uint8)

print("Dominant colors (BGR):", colors)

# -------------------------------
# 3️⃣ Create output folder
# -------------------------------
output_dir = "color_regions"
os.makedirs(output_dir, exist_ok=True)

# -------------------------------
# 4️⃣ Parameters for filtering
# -------------------------------
tolerance = 40   # how similar colors need to be
min_area = 500   # minimum region area in pixels
kernel = np.ones((5, 5), np.uint8)  # for morphological operations

# -------------------------------
# 5️⃣ Extract regions for each color
# -------------------------------
for idx, color in enumerate(colors):
    # Create a mask for this color
    lower = np.maximum(color - tolerance, 0)
    upper = np.minimum(color + tolerance, 255)
    mask = cv2.inRange(image, lower, upper)

    # Morphological operations to merge regions and remove noise
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    # Find contours of regions
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filter small contours
    filtered_contours = [c for c in contours if cv2.contourArea(c) >= min_area]

    # Folder for this color
    color_folder = os.path.join(output_dir, f"color_{idx+1}")
    os.makedirs(color_folder, exist_ok=True)

    # Crop and save each region
    for i, contour in enumerate(filtered_contours):
        x, y, w_box, h_box = cv2.boundingRect(contour)
        cropped = image[y:y+h_box, x:x+w_box]
        cv2.imwrite(os.path.join(color_folder, f"region_{i+1}.jpg"), cropped)

    print(f"Saved {len(filtered_contours)} regions for color {idx+1}")

print("Done! Check the 'color_regions' folder.")
