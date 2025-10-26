import os
import sys
import warnings

# Configure environment BEFORE importing packages to prevent JavaScript loading
os.environ['MPLBACKEND'] = 'Agg'  # Non-interactive matplotlib backend
os.environ['JUPYTER_PLATFORM_DIRS'] = '0'  # Disable Jupyter scanning

# Suppress JavaScript-related warnings
warnings.filterwarnings('ignore', category=UserWarning)

import io
from fastapi import FastAPI, UploadFile, File
from sklearn.tree import DecisionTreeClassifier
import pandas as pd
import numpy as np
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse

df = pd.read_csv(r"final_data.csv").dropna()

X=df.iloc[:,:3]
y = df.iloc[:,3]

model = DecisionTreeClassifier(max_depth=8,random_state=20251025)

model.fit(X,y)

app = FastAPI()

class FileURI(BaseModel):
    file_uri: str

class ImageData(BaseModel):
    image_data: str  # Base64 encoded image


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, etc.
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
            import base64
            # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
            if ',' in file_path:
                file_path = file_path.split(',')[1]
            file_bytes = base64.b64decode(file_path)

        img = Image.open(io.BytesIO(file_bytes))
        img = img.convert("RGB")

        # Fixed: getData() should be getdata() (lowercase)
        pixels = list(img.getdata())
        
        # Extract RGB values from all pixels and calculate averages
        pixels_array = np.array(pixels)
        r = np.mean(pixels_array[:, 0])
        g = np.mean(pixels_array[:, 1])
        b = np.mean(pixels_array[:, 2])
        # print('pixels: ' + pixels)

        # r, g, b = img.getpixel((x, y))
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


@app.get("/color")
async def color_identify(x,y,z):
    data = pd.DataFrame([{"red": x, "green": y, "blue": z}])
    return model.predict(data)[0]