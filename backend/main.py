# import os
# import sys
# import warnings

# # Configure environment BEFORE importing packages to prevent JavaScript loading
# os.environ['MPLBACKEND'] = 'Agg'  # Non-interactive matplotlib backend
# os.environ['JUPYTER_PLATFORM_DIRS'] = '0'  # Disable Jupyter scanning

# # Suppress JavaScript-related warnings
# warnings.filterwarnings('ignore', category=UserWarning)

# import io
# from fastapi import FastAPI, UploadFile, File
# from sklearn.tree import DecisionTreeClassifier
# import pandas as pd
# import numpy as np
# from PIL import Image
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from fastapi.responses import JSONResponse

# df = pd.read_csv(r"final_data.csv").dropna()

# X=df.iloc[:,:3]
# y = df.iloc[:,3]

# model = DecisionTreeClassifier(max_depth=8,random_state=20251025)

# model.fit(X,y)

# app = FastAPI()

# class FileURI(BaseModel):
#     file_uri: str

# class ImageData(BaseModel):
#     image_data: str  # Base64 encoded image


# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Frontend origin
#     allow_credentials=True,
#     allow_methods=["*"],  # GET, POST, etc.
#     allow_headers=["*"],
# )


# # @app.post("/uploadfile")
# # async def upload_file(file: UploadFile = File(...)):
# #     content = await file.read()
# #     print(file.file)
# #     pix = Image.open(file.file).load()
# #     print(pix[25,60])
#     # return {"filename": file.filename, "file_size": len(content), "file_mime_type": file.content_type}

# @app.post("/uploadfile")
# async def upload_file(data: FileURI): 
#     print("python!")
#     file_path = data.file_uri

#     try:
#         # Try to read from file path first (for simulators)
#         try:
#             with open(file_path, "rb") as f:
#                 file_bytes = f.read()
#         except:
#             # If file path doesn't work, try to decode as base64 (for physical devices)
#             import base64
#             # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
#             if ',' in file_path:
#                 file_path = file_path.split(',')[1]
#             file_bytes = base64.b64decode(file_path)

#         img = Image.open(io.BytesIO(file_bytes))
#         img = img.convert("RGB")

#         # Fixed: getData() should be getdata() (lowercase)
#         pixels = list(img.getdata())
        
#         # Extract RGB values from all pixels and calculate averages
#         pixels_array = np.array(pixels)
#         r = np.mean(pixels_array[:, 0])
#         g = np.mean(pixels_array[:, 1])
#         b = np.mean(pixels_array[:, 2])
#         # print('pixels: ' + pixels)

#         # r, g, b = img.getpixel((x, y))
#         data = pd.DataFrame([{"red": r, "green": g, "blue": b}])
#         prediction = model.predict(data)[0]

#         return JSONResponse({
#             "message": "color predicted successfully",
#             "prediction": prediction,
#         })
    
#     except FileNotFoundError:
#         return JSONResponse({"error": "File not found"}, status_code=404)
#     except Exception as e:
#         return JSONResponse({"error": str(e)}, status_code=500)


# @app.get("/color")
# async def color_identify(x,y,z):
#     data = pd.DataFrame([{"red": x, "green": y, "blue": z}])
#     return model.predict(data)[0]

import os
import sys
import warnings

# Configure environment BEFORE importing packages to prevent JavaScript loading
os.environ['MPLBACKEND'] = 'Agg'  # Non-interactive matplotlib backend
os.environ['JUPYTER_PLATFORM_DIRS'] = '0'  # Disable Jupyter scanning

# Suppress JavaScript-related warnings
warnings.filterwarnings('ignore', category=UserWarning)

import io
import base64
from fastapi import FastAPI, UploadFile, File
from sklearn.tree import DecisionTreeClassifier
import pandas as pd
import numpy as np
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse

# NEW: Import YOLO for object detection
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
    # Load YOLOv8 model (nano version for speed)
    yolo_model = YOLO('yolov8n.pt')
except ImportError:
    YOLO_AVAILABLE = False
    print("Warning: ultralytics not installed. Object detection will not be available.")
    print("Install with: pip install ultralytics")

df = pd.read_csv(r"final_data.csv").dropna()

X = df.iloc[:,:3]
y = df.iloc[:,3]

model = DecisionTreeClassifier(max_depth=8, random_state=20251025)
model.fit(X, y)

app = FastAPI()

class FileURI(BaseModel):
    file_uri: str

class ImageData(BaseModel):
    image: str  # Base64 encoded image

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/uploadfile")
async def upload_file(data: FileURI): 
    print("python!")
    file_path = data.file_uri

    try:
        # Try to read from file path first (for simulators)
        try:
            with open(file_path, "rb") as f:
                file_bytes = f.read()
        except:
            # If file path doesn't work, try to decode as base64 (for physical devices)
            # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
            if ',' in file_path:
                file_path = file_path.split(',')[1]
            file_bytes = base64.b64decode(file_path)

        img = Image.open(io.BytesIO(file_bytes))
        img = img.convert("RGB")

        pixels = list(img.getdata())
        
        # Extract RGB values from all pixels and calculate averages
        pixels_array = np.array(pixels)
        r = np.mean(pixels_array[:, 0])
        g = np.mean(pixels_array[:, 1])
        b = np.mean(pixels_array[:, 2])

        data = pd.DataFrame([{"red": r, "green": g, "blue": b}])
        prediction = model.predict(data)[0]

        return JSONResponse({
            "message": "color predicted successfully",
            "prediction": prediction,
        })
    
    except FileNotFoundError:
        return JSONResponse({"error": "File not found"}, status_code=404)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# NEW: Object detection endpoint
@app.post("/detect-objects")
async def detect_objects(data: ImageData):
    """
    Detect objects in an image and return bounding boxes with labels
    """
    if not YOLO_AVAILABLE:
        return JSONResponse({
            "error": "YOLO not available. Install with: pip install ultralytics",
            "detections": []
        }, status_code=500)
    
    try:
        # Decode base64 image
        image_data = base64.b64decode(data.image)
        img = Image.open(io.BytesIO(image_data))
        img = img.convert("RGB")
        
        # Run YOLO detection
        results = yolo_model(img, conf=0.5, verbose=False)
        
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Get normalized coordinates (0-1)
                x1, y1, x2, y2 = box.xyxyn[0].tolist()
                
                detections.append({
                    'label': yolo_model.names[int(box.cls)],
                    'confidence': float(box.conf),
                    'bbox': {
                        'x': x1,
                        'y': y1,
                        'width': x2 - x1,
                        'height': y2 - y1,
                    }
                })
        
        return JSONResponse({
            'detections': detections,
            'count': len(detections)
        })
        
    except Exception as e:
        print(f"Error in object detection: {str(e)}")
        return JSONResponse({
            'error': str(e),
            'detections': []
        }, status_code=500)


# NEW: Enhanced color detection endpoint that works with bounding boxes
@app.post("/detect-color-in-box")
async def detect_color_in_box(data: ImageData):
    """
    Detect color within a specific region of an image
    Expects: { "image": base64_string, "bbox": {"x": 0.2, "y": 0.3, "width": 0.4, "height": 0.5} }
    """
    try:
        # Parse the incoming data
        import json
        request_data = json.loads(data.image) if isinstance(data.image, str) and data.image.startswith('{') else {"image": data.image}
        
        # Decode base64 image
        image_b64 = request_data.get('image', data.image)
        image_data = base64.b64decode(image_b64)
        img = Image.open(io.BytesIO(image_data))
        img = img.convert("RGB")
        
        # If bbox provided, crop to that region
        if 'bbox' in request_data:
            bbox = request_data['bbox']
            width, height = img.size
            
            # Convert normalized coordinates to pixels
            left = int(bbox['x'] * width)
            top = int(bbox['y'] * height)
            right = int((bbox['x'] + bbox['width']) * width)
            bottom = int((bbox['y'] + bbox['height']) * height)
            
            # Crop image to bounding box
            img = img.crop((left, top, right, bottom))
        
        # Get average color from the image/region
        pixels = list(img.getdata())
        pixels_array = np.array(pixels)
        r = np.mean(pixels_array[:, 0])
        g = np.mean(pixels_array[:, 1])
        b = np.mean(pixels_array[:, 2])
        
        # Predict color using your model
        color_data = pd.DataFrame([{"red": r, "green": g, "blue": b}])
        prediction = model.predict(color_data)[0]
        
        return JSONResponse({
            "message": "color predicted successfully",
            "prediction": prediction,
            "rgb": {"r": int(r), "g": int(g), "b": int(b)}
        })
        
    except Exception as e:
        print(f"Error in color detection: {str(e)}")
        return JSONResponse({
            "error": str(e)
        }, status_code=500)


@app.get("/color")
async def color_identify(x, y, z):
    data = pd.DataFrame([{"red": x, "green": y, "blue": z}])
    return model.predict(data)[0]


# NEW: Health check endpoint
@app.get("/")
async def root():
    return {
        "status": "online",
        "endpoints": {
            "/uploadfile": "Upload image for color detection",
            "/detect-objects": "Detect objects in image",
            "/detect-color-in-box": "Detect color in specific region",
            "/color": "Direct RGB to color prediction"
        },
        "yolo_available": YOLO_AVAILABLE
    }