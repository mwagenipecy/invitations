#!/bin/bash

# Build script for Android Scanner App
# This script will download Gradle wrapper and build the APK

echo "Setting up Android project..."

# Make gradlew executable
chmod +x gradlew 2>/dev/null || true

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "Error: Java is not installed. Please install Java JDK 11 or higher."
    exit 1
fi

echo "Java found: $(java -version 2>&1 | head -1)"

# Check if Android SDK is needed
if [ -z "$ANDROID_HOME" ]; then
    echo ""
    echo "⚠️  Android SDK not found in environment."
    echo ""
    echo "To build without Android Studio, you need:"
    echo "1. Android SDK (command line tools)"
    echo "2. OR use Android Studio (recommended)"
    echo ""
    echo "The easiest way is to install Android Studio:"
    echo "https://developer.android.com/studio"
    echo ""
    echo "Android Studio includes:"
    echo "  ✅ Kotlin compiler"
    echo "  ✅ Android SDK"
    echo "  ✅ All build tools"
    echo ""
    exit 1
fi

echo "Building APK..."
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo "APK location: app/build/outputs/apk/debug/app-debug.apk"
else
    echo ""
    echo "❌ Build failed. Please install Android Studio for easier setup."
fi

