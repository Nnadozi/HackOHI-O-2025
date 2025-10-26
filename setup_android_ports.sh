#!/bin/bash

# Setup ADB port forwarding for Android development

echo "Setting up ADB port forwarding..."
echo ""

# Forward bridge server port
adb reverse tcp:3000 tcp:3000
if [ $? -eq 0 ]; then
    echo "✅ Port 3000 (Bridge Server) forwarded"
else
    echo "❌ Failed to forward port 3000"
    exit 1
fi

# Forward FastAPI port (optional, but useful)
adb reverse tcp:8000 tcp:8000
if [ $? -eq 0 ]; then
    echo "✅ Port 8000 (FastAPI Backend) forwarded"
else
    echo "❌ Failed to forward port 8000"
    exit 1
fi

echo ""
echo "✅ Port forwarding complete!"
echo "Your Android device can now access:"
echo "  - Bridge Server: http://localhost:3000"
echo "  - FastAPI Backend: http://localhost:8000"
echo ""
echo "Note: You need to run this script each time you reconnect your Android device"
