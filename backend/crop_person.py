from rembg import remove
from PIL import Image
import numpy as np
import sys
import os

def crop_to_foreground_mask(input_path, output_path, padding=10, output_format="PNG"):
    # Load image bytes
    with open(input_path, "rb") as f:
        input_bytes = f.read()

    # Remove background (returns PNG bytes with alpha channel)
    result_bytes = remove(input_bytes)

    # Open result as PIL image (has alpha)
    mask_img = Image.open(io.BytesIO(result_bytes)).convert("RGBA")
    orig_img = Image.open(input_path).convert("RGBA")

    # Convert alpha channel to numpy array and find bounding box
    alpha = np.array(mask_img.split()[-1])  # alpha channel
    non_empty = np.argwhere(alpha > 0)  # rows, cols where alpha > 0
    if non_empty.size == 0:
        print("No foreground detected; saving original or returning failure.")
        orig_img.save(output_path, format=output_format)
        return

    # Compute bounding box
    y_min, x_min = non_empty.min(axis=0)
    y_max, x_max = non_empty.max(axis=0)

    # Add padding and clamp
    x_min = max(0, x_min - padding)
    y_min = max(0, y_min - padding)
    x_max = min(orig_img.width - 1, x_max + padding)
    y_max = min(orig_img.height - 1, y_max + padding)

    cropped = orig_img.crop((x_min, y_min, x_max + 1, y_max + 1))
    # If you want background removed in output (transparent), save as PNG with alpha from mask:
    # create a cropped mask too, composite if needed
    cropped.save(output_path, format=output_format)
    print(f"Cropped image saved to {output_path}")

if __name__ == "__main__":
    import io
    if len(sys.argv) < 3:
        print("Usage: python crop_person.py input.jpg output.png")
        sys.exit(1)
    in_path = sys.argv[1]
    out_path = sys.argv[2]
    crop_to_foreground_mask(in_path, out_path, padding=20, output_format="PNG")