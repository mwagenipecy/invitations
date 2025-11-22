# Android Scanner App - Simple Setup

## Important: Kotlin is NOT installed separately!

**Kotlin comes automatically with:**
- ✅ Android Studio (recommended)
- ✅ Gradle (downloads it automatically)

You don't need to install Kotlin manually!

## Easiest Way: Install Android Studio

1. **Download Android Studio:**
   ```
   https://developer.android.com/studio
   ```
   - Free download (~1GB)
   - Includes everything: Kotlin, Android SDK, build tools

2. **Open the project:**
   - Launch Android Studio
   - File → Open → Select `mobile/android` folder
   - Wait for Gradle to sync (downloads Kotlin automatically)

3. **Build APK:**
   - Build → Build APK(s)
   - Done! APK is in `app/build/outputs/apk/debug/`

## What Android Studio Includes

- ✅ Kotlin compiler (no separate install needed)
- ✅ Android SDK
- ✅ Gradle build system
- ✅ All dependencies
- ✅ Emulator (optional)

## Alternative: Command Line (Advanced)

If you want to build without Android Studio, you need:
1. Android SDK Command Line Tools
2. Set `ANDROID_HOME` environment variable
3. Then run: `./gradlew assembleDebug`

But **Android Studio is much easier** and recommended!

## Summary

**You don't need to install Kotlin separately!**

Just install Android Studio - it handles everything including Kotlin.

