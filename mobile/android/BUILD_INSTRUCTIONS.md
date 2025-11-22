# Building the Android Scanner App

## Prerequisites

1. Android Studio (latest version)
2. Android SDK (API 24+)
3. JDK 8 or higher

## Setup Steps

1. **Open Project in Android Studio**
   - Open Android Studio
   - Select "Open an Existing Project"
   - Navigate to `mobile/android` folder
   - Click "OK"

2. **Configure SDK**
   - Android Studio will prompt to sync Gradle files
   - Wait for dependencies to download

3. **Update API URL**
   - Open `app/src/main/java/com/invitation/scanner/ApiService.kt`
   - Update `BASE_URL`:
     - For Android Emulator: `http://10.0.2.2:5001/`
     - For Physical Device: `http://YOUR_COMPUTER_IP:5001/`
     - Find your IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)

4. **Build APK**
   - Go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - Or use command line: `./gradlew assembleRelease`
   - APK will be in `app/build/outputs/apk/release/app-release.apk`

5. **Install on Device**
   - Transfer APK to Android device
   - Enable "Install from Unknown Sources" in device settings
   - Install the APK

## Default Credentials

- Email: `scanner_user`
- Password: `scanner_pass_2024`

## Features

- Automatic authentication on app start
- QR code scanning using device camera
- Automatic check-in to backend system
- Simple, focused UI for scanning

## Permissions Required

- Camera (for QR scanning)
- Internet (for API calls)

