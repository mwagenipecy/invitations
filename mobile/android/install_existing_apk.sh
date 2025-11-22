#!/bin/bash

# Install existing APK to wireless device

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
ADB_PATH="$HOME/Library/Android/sdk/platform-tools/adb"

if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK not found at: $APK_PATH"
    echo "   Please build the APK first: ./gradlew assembleDebug"
    exit 1
fi

if [ ! -f "$ADB_PATH" ]; then
    echo "❌ ADB not found at: $ADB_PATH"
    exit 1
fi

echo "=== Installing APK to wireless device ==="
echo "APK: $APK_PATH"
echo ""

# Check devices
DEVICES=$("$ADB_PATH" devices | grep -v "List of devices" | grep "device" | wc -l | tr -d ' ')

if [ "$DEVICES" -eq 0 ]; then
    echo "❌ No devices connected."
    echo ""
    echo "Current devices:"
    "$ADB_PATH" devices
    exit 1
fi

echo "✅ Found $DEVICES device(s)"
echo ""

# Install
"$ADB_PATH" install -r "$APK_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK installed successfully!"
    echo "   Open 'Invitation Scanner' on your device."
else
    echo ""
    echo "❌ Installation failed."
fi

