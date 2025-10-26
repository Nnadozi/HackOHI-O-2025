#!/usr/bin/env python3
"""
Startup script for the FastAPI backend that properly configures the environment
to avoid JavaScript loading errors from Python packages.
"""

import os
import sys
import warnings

# Set environment variables BEFORE importing any packages
# This prevents matplotlib and other packages from loading JavaScript components
os.environ['MPLBACKEND'] = 'Agg'  # Use non-interactive matplotlib backend
os.environ['JUPYTER_PLATFORM_DIRS'] = '0'  # Disable Jupyter directory scanning
os.environ['IPYTHONDIR'] = '/tmp'  # Redirect IPython config to temp

# Suppress warnings about missing JavaScript environments
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', message='.*IPython.*')
warnings.filterwarnings('ignore', message='.*JavaScript.*')

# Now we can safely import and run the FastAPI app
import uvicorn

if __name__ == "__main__":
    print("🚀 Starting FastAPI backend with proper configuration...")
    print("📝 Environment configured to prevent JavaScript loading errors")
    print("🌐 Server will be available at http://localhost:8000")
    print("📚 API documentation at http://localhost:8000/docs")
    print("-" * 50)
    
    # Run the server using import string for proper reload functionality
    uvicorn.run(
        "main:app",  # Import string format: module:app_variable
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )
