# Android Scanner App - Setup Guide

## Prerequisites Installation

### Step 1: Install Android Studio

1. **Download Android Studio:**
   - Visit: https://developer.android.com/studio
   - Download for macOS
   - The installer is about 1GB

2. **Install Android Studio:**
   - Open the downloaded `.dmg` file
   - Drag Android Studio to Applications folder
   - Launch Android Studio

3. **First Time Setup:**
   - Android Studio will download Android SDK automatically
   - This may take 10-20 minutes
   - Kotlin plugin is included automatically

### Step 2: Open the Project

1. **Open Android Studio**
2. **Select "Open an Existing Project"**
3. **Navigate to:** `/Users/mac/Desktop/PercyFolder/Invitation/mobile/android`
4. **Click "OK"**
5. **Wait for Gradle Sync:**
   - Android Studio will automatically download all dependencies
   - This includes Kotlin, Android SDK, and all libraries
   - First sync may take 5-10 minutes

### Step 3: Configure SDK Location

If Android Studio asks for SDK location:
- Default location: `~/Library/Android/sdk`
- Or let Android Studio set it up automatically

### Step 4: Update API URL

1. Open: `app/src/main/java/com/invitation/scanner/ApiService.kt`
2. Find the `BASE_URL` constant
3. Update it:
   - **For Android Emulator:** `http://10.0.2.2:5001/`
   - **For Physical Device:** `http://YOUR_COMPUTER_IP:5001/`
   - To find your IP: Open Terminal and run `ifconfig | grep "inet "`

### Step 5: Build the APK

**Option A: Using Android Studio GUI**
1. Go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. Wait for build to complete
3. APK location: `app/build/outputs/apk/debug/app-debug.apk`

**Option B: Using Command Line**
```bash
cd /Users/mac/Desktop/PercyFolder/Invitation/mobile/android
./gradlew assembleDebug
```

### Step 6: Install on Device

1. **Enable Developer Options on Android Device:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. **Transfer APK:**
   - Connect device via USB, or
   - Transfer APK file to device via email/cloud
   - Install APK on device

3. **Enable Unknown Sources:**
   - Settings → Security → Allow installation from unknown sources

## Alternative: Build Without Android Studio

If you prefer not to install Android Studio, you can use command line tools:

### Install Command Line Tools Only

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Java JDK
brew install openjdk@11

# Download Android SDK Command Line Tools
mkdir -p ~/android-sdk
cd ~/android-sdk
curl -O https://dl.google.com/android/repository/commandlinetools-mac-9477386_latest.zip
unzip commandlinetools-mac-9477386_latest.zip
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true

# Set environment variables
echo 'export ANDROID_HOME=$HOME/android-sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc

# Accept licenses and install SDK
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

Then build:
```bash
cd /Users/mac/Desktop/PercyFolder/Invitation/mobile/android
./gradlew assembleDebug
```

## Troubleshooting

**"Kotlin not found" error:**
- This means Gradle hasn't synced yet
- Wait for Android Studio to finish downloading dependencies
- Or run: `./gradlew build --refresh-dependencies`

**"SDK not found" error:**
- Open Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK
- Install Android SDK Platform 34
- Install Android SDK Build-Tools

**Build fails:**
- Make sure you have internet connection (Gradle downloads dependencies)
- Check that Java JDK is installed: `java -version`
- Try: `./gradlew clean build`

## Quick Start (Recommended)

The easiest way is to install Android Studio - it handles everything automatically including Kotlin!

