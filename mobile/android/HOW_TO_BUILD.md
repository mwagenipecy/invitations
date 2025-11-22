# How to Build the APK

## Current Status

✅ **Project is ready to build**
✅ **All source code files created**
✅ **Android SDK configured**
✅ **Gradle wrapper ready**

❌ **Internet connection required for first build**

## The Problem

The build failed because:
- No internet connection detected
- Dependencies need to be downloaded from Maven/Google repositories
- First build requires ~200MB of downloads

## Solution: Build with Internet Connection

### Step 1: Connect to Internet
Make sure your computer has internet access.

### Step 2: Build the APK
```bash
cd /Users/mac/Desktop/PercyFolder/Invitation/mobile/android
./gradlew assembleDebug
```

### Step 3: Wait for Dependencies
- First build: 5-10 minutes (downloads all dependencies)
- Subsequent builds: 1-2 minutes (uses cache)

### Step 4: Find Your APK
After successful build, the APK will be at:
```
app/build/outputs/apk/debug/app-debug.apk
```

## Alternative: Use Android Studio

If you prefer a GUI:

1. **Open Android Studio**
2. **File → Open** → Select `mobile/android` folder
3. **Wait for Gradle sync** (downloads dependencies automatically)
4. **Build → Build APK(s)**
5. APK location: `app/build/outputs/apk/debug/app-debug.apk`

## What Gets Downloaded

- Kotlin compiler and libraries
- Android SDK components
- CameraX libraries
- ML Kit barcode scanning
- Retrofit for API calls
- Other Android dependencies

Total: ~200MB (one-time download)

## After First Build

Once dependencies are cached, you can build offline:
```bash
./gradlew assembleDebug --offline
```

## Install on Phone

1. Transfer `app-debug.apk` to your Android phone
2. Enable "Install from Unknown Sources" in phone settings
3. Open the APK file and install
4. Open the app and scan QR codes!

## Troubleshooting

**"Could not resolve..." errors:**
- Check internet connection
- Try: `./gradlew clean build --refresh-dependencies`

**"SDK not found":**
- Already configured in `local.properties`
- If issues, check: `cat local.properties`

**Build succeeds but APK not found:**
- Check: `app/build/outputs/apk/debug/`
- Look for `app-debug.apk`

## Quick Command Summary

```bash
# Build APK (requires internet first time)
cd /Users/mac/Desktop/PercyFolder/Invitation/mobile/android
./gradlew assembleDebug

# Clean and rebuild
./gradlew clean assembleDebug

# Build offline (after first build)
./gradlew assembleDebug --offline
```

