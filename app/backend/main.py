import os
from fastapi import FastAPI, UploadFile, File
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
import pandas as pd
import numpy as np
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware

df = pd.read_csv(r"final_data.csv").dropna()


X=df.iloc[:,:3]
y = df.iloc[:,3]

model = DecisionTreeClassifier(max_depth=8,random_state=20251025)

model.fit(X,y)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8083", "http://localhost:8081"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, etc.
    allow_headers=["*"],
)


@app.post("/uploadfile")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    print(file.file)
    pix = Image.open(file.file).load()
    print(pix[25,60])
    # return {"filename": file.filename, "file_size": len(content), "file_mime_type": file.content_type}


@app.get("/color")
async def color_identify(x,y,z):
    data = pd.DataFrame([{"red": x, "green": y, "blue": z}])
    return model.predict(data)[0]