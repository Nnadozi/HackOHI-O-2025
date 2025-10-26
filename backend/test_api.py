#!/usr/bin/env python3
"""
Simple test script to verify the FastAPI backend is working correctly.
Run this after starting the backend with: fastapi dev main.py
"""

import requests
import json

# Backend URL (adjust if running on different port)
BASE_URL = "http://172.30.111.182:8000"

def test_color_endpoint():
    """Test the /color endpoint with RGB values"""
    print("Testing /color endpoint...")
    
    # Test with some RGB values
    response = requests.get(f"{BASE_URL}/color", params={
        "x": 255,  # Red
        "y": 0,    # Green
        "z": 0     # Blue
    })
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Color prediction successful: {result}")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")

def test_upload_endpoint():
    """Test the /uploadfile endpoint"""
    print("\nTesting /uploadfile endpoint...")
    
    # Note: This requires a valid image file path on your system
    # You'll need to update this path to an actual image file
    test_image_path = "/path/to/test/image.jpg"
    
    payload = {
        "file_uri": test_image_path
    }
    
    response = requests.post(
        f"{BASE_URL}/uploadfile",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Upload successful: {result}")
    elif response.status_code == 404:
        print(f"⚠️  File not found (expected if test path doesn't exist)")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")

def test_server_health():
    """Check if the server is running"""
    print("Checking server health...")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ Server is running and API docs are accessible")
            print(f"   Visit {BASE_URL}/docs to see the interactive API documentation")
            return True
    except requests.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running with: fastapi dev main.py")
        return False
    return False

if __name__ == "__main__":
    print("=" * 50)
    print("FastAPI Backend Test")
    print("=" * 50)
    
    if test_server_health():
        print()
        test_color_endpoint()
        test_upload_endpoint()
    
    print("\n" + "=" * 50)
    print("Test complete!")
