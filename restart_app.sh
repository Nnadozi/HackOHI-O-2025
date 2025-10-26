#!/bin/bash

# Script to properly restart the React Native app with clean cache

echo "🧹 Cleaning Metro bundler cache..."
npx expo start -c

# Alternative commands if needed:
# npx react-native start --reset-cache
# watchman watch-del-all
