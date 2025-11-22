# Quick Start - Android Scanner App

## Simplest Method: Use Android Studio

1. **Download & Install Android Studio:**
   ```
   https://developer.android.com/studio
   ```
   - Kotlin is included automatically
   - No separate Kotlin installation needed

2. **Open Project:**
   - Launch Android Studio
   - Open: `/Users/mac/Desktop/PercyFolder/Invitation/mobile/android`
   - Wait for Gradle to sync (downloads everything automatically)

3. **Update API URL:**
   - File: `app/src/main/java/com/invitation/scanner/ApiService.kt`
   - Change `BASE_URL` to your backend IP

4. **Build APK:**
   - Menu: `Build` → `Build APK(s)`
   - Find APK in: `app/build/outputs/apk/debug/`

5. **Install on Phone:**
   - Transfer APK to Android device
   - Install and run

## That's It!

Android Studio includes:
- ✅ Kotlin compiler
- ✅ Android SDK
- ✅ All build tools
- ✅ Everything you need

No separate Kotlin installation required!

