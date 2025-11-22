#!/bin/bash

# Build and Install APK to Wireless Device

echo "=== Building APK ==="
cd "$(dirname "$0")"

# Build the APK
./gradlew assembleDebug --no-daemon

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed. Make sure you have internet connection."
    echo "   Run: ./gradlew assembleDebug"
    exit 1
fi

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"

if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK not found at: $APK_PATH"
    exit 1
fi

echo ""
echo "✅ APK built successfully!"
echo "   Location: $APK_PATH"
echo ""

# Check for connected devices
ADB_PATH="$HOME/Library/Android/sdk/platform-tools/adb"

if [ ! -f "$ADB_PATH" ]; then
    echo "❌ ADB not found. Please install Android SDK."
    exit 1
fi

echo "=== Checking for connected devices ==="
DEVICES=$("$ADB_PATH" devices | grep -v "List of devices" | grep "device" | wc -l | tr -d ' ')

if [ "$DEVICES" -eq 0 ]; then
    echo ""
    echo "❌ No devices connected."
    echo ""
    echo "To connect wirelessly:"
    echo "1. Enable USB debugging on your phone"
    echo "2. Connect via USB first, then run:"
    echo "   adb tcpip 5555"
    echo "   adb connect YOUR_PHONE_IP:5555"
    echo "3. Disconnect USB and run this script again"
    exit 1
fi

echo "✅ Found $DEVICES device(s)"
echo ""

# Install APK
echo "=== Installing APK to device ==="
"$ADB_PATH" install -r "$APK_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK installed successfully!"
    echo ""
    echo "The app 'Invitation Scanner' is now on your device."
    echo "Open it and start scanning QR codes!"
else
    echo ""
    echo "❌ Installation failed."
    echo "   Make sure your device is connected and USB debugging is enabled."
    exit 1
fi

