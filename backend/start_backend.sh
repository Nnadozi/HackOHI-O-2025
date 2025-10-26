#!/bin/bash

# Color codes for pretty output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Color Prediction Backend${NC}"
echo "----------------------------------------"

# Navigate to backend directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv .venv
fi

# Activate virtual environment
echo -e "${GREEN}✅ Activating virtual environment...${NC}"
source .venv/bin/activate

# Check if dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    pip install -r requirements.txt
fi

# Set environment variables to prevent JavaScript errors
export MPLBACKEND=Agg
export JUPYTER_PLATFORM_DIRS=0
export IPYTHONDIR=/tmp

echo -e "${GREEN}🌐 Starting FastAPI server...${NC}"
echo -e "${GREEN}📚 API docs will be available at: http://localhost:8000/docs${NC}"
echo "----------------------------------------"

# Run the backend using the custom startup script
python run_backend.py
