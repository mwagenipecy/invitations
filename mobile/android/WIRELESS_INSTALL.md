# Install APK to Wireless Device

## Current Status

✅ **ADB is available**
✅ **Device connected wirelessly**: `adb-RR8W106LM8E-zpH1dy`

## Quick Install (If APK Already Built)

If you've already built the APK:
```bash
cd /Users/mac/Desktop/PercyFolder/Invitation/mobile/android
./install_existing_apk.sh
```

## Build and Install (One Command)

To build and install in one go:
```bash
cd /Users/mac/Desktop/PercyFolder/Invitation/mobile/android
./build_and_install.sh
```

**Note:** This requires internet connection for the first build.

## Manual Steps

### Step 1: Build APK
```bash
cd /Users/mac/Desktop/PercyFolder/Invitation/mobile/android
./gradlew assembleDebug
```

### Step 2: Install to Device
```bash
~/Library/Android/sdk/platform-tools/adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Connect New Device Wirelessly

If you need to connect a new device:

1. **Connect via USB first:**
   ```bash
   adb devices  # Verify device is connected
   ```

2. **Enable wireless debugging:**
   ```bash
   adb tcpip 5555
   ```

3. **Find your phone's IP:**
   - Settings → About Phone → Status → IP Address
   - Or: Settings → Wi-Fi → Tap on connected network

4. **Connect wirelessly:**
   ```bash
   adb connect YOUR_PHONE_IP:5555
   ```

5. **Disconnect USB and verify:**
   ```bash
   adb devices  # Should show device via IP
   ```

## Troubleshooting

**"device offline":**
- Reconnect: `adb disconnect` then `adb connect IP:5555`

**"no devices/emulators found":**
- Check: `adb devices`
- Re-enable wireless: `adb tcpip 5555` (while USB connected)

**"INSTALL_FAILED":**
- Enable "Install from Unknown Sources" on device
- Or: `adb install -r -d app-debug.apk` (with -d flag)

## Current Connected Device

Your device is already connected wirelessly:
- Device ID: `RR8W106LM8E`
- Connection: `adb-tls-connect` (wireless)

You can install the APK once it's built!

