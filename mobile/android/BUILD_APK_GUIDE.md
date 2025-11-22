# Build APK - Quick Guide

## Problem: Android SDK Not Found

To build the APK, you need the **Android SDK**. There are two ways to get it:

## Option 1: Install Android Studio (Easiest - Recommended)

1. **Download Android Studio:**
   ```
   https://developer.android.com/studio
   ```

2. **Install and Open Project:**
   - Launch Android Studio
   - Open: `/Users/mac/Desktop/PercyFolder/Invitation/mobile/android`
   - Android Studio will automatically set up the SDK

3. **Build APK:**
   - Menu: `Build` → `Build APK(s)`
   - APK will be in: `app/build/outputs/apk/debug/app-debug.apk`

## Option 2: Install SDK Command Line Tools Only

If you don't want Android Studio, you can install just the SDK:

```bash
# 1. Create SDK directory
mkdir -p ~/android-sdk
cd ~/android-sdk

# 2. Download command line tools
curl -O https://dl.google.com/android/repository/commandlinetools-mac-9477386_latest.zip
unzip commandlinetools-mac-9477386_latest.zip
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true

# 3. Accept licenses and install SDK
export ANDROID_HOME=~/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# 4. Create local.properties
cd /Users/mac/Desktop/PercyFolder/Invitation/mobile/android
echo "sdk.dir=$HOME/android-sdk" > local.properties

# 5. Build APK
./gradlew assembleDebug
```

## Current Status

✅ Gradle is ready  
✅ Kotlin will download automatically  
❌ Android SDK needed  

**Recommendation:** Install Android Studio - it's much easier and includes everything!

