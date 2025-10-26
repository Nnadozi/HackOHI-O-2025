#!/bin/bash

# Script to start both FastAPI backend and Node.js bridge server

echo "=================================================="
echo "🚀 Starting Inchroma Backend Services"
echo "=================================================="

# Start FastAPI backend
echo ""
echo "📦 Starting FastAPI backend on port 8000..."
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
FASTAPI_PID=$!
cd ..

# Wait for FastAPI to start
sleep 2

# Start Node.js bridge
echo ""
echo "🌉 Starting Node.js bridge server on port 3000..."
cd bridge
node server.js &
BRIDGE_PID=$!
cd ..

echo ""
echo "=================================================="
echo "✅ Both servers are running!"
echo "=================================================="
echo "FastAPI Backend: http://localhost:8000"
echo "Bridge Server:   http://localhost:3000"
echo ""
echo "API Docs:        http://localhost:8000/docs"
echo "Bridge Health:   http://localhost:3000/health"
echo ""
echo "To stop servers, press Ctrl+C"
echo "=================================================="

# Wait for both processes
wait $FASTAPI_PID $BRIDGE_PID
