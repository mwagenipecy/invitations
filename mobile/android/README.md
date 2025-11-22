# Invitation Scanner - Android App

QR Code Scanner app for checking in invitees at events.

## Features

- Default user authentication (hardcoded credentials)
- QR code scanning using CameraX and ML Kit
- Automatic check-in to backend system
- Simple, focused UI

## Setup

1. Open the project in Android Studio
2. Update the BASE_URL in `ApiService.kt`:
   - For emulator: `http://10.0.2.2:5001/`
   - For physical device: `http://YOUR_COMPUTER_IP:5001/`
3. Build and run the app

## Default Credentials

- Username: `scanner_user`
- Password: `scanner_pass_2024`

## Permissions

- Camera (required for QR scanning)
- Internet (required for API calls)

## Building APK

```bash
./gradlew assembleRelease
```

The APK will be in `app/build/outputs/apk/release/`

