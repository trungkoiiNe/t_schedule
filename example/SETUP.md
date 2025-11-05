# Example App Setup Guide

This guide will help you set up and run the example app for react-native-t-schedule.

## Prerequisites

- Node.js (v16 or higher)
- Yarn or npm
- React Native development environment set up
- Android Studio or Xcode (depending on your target platform)

## Installation

1. **Navigate to the example directory:**

```bash
cd example
```

2. **Install dependencies:**

```bash
yarn install
# or
npm install
```

3. **Install iOS dependencies (macOS only):**

```bash
cd ios
pod install
cd ..
```

## Configuration

### Google Sign-In Setup

1. **Get your Web Client ID:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project (or create a new one)
   - Go to Project Settings → General
   - Copy the "Web client ID"

2. **Configure Google Sign-In in the app:**

Open `example/src/App.tsx` (or create an initialization file) and add:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  offlineAccess: true,
});
```

### iOS Configuration

1. **Update Info.plist:**

Add the following to `example/ios/TScheduleExample/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>YOUR_REVERSED_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

Replace `YOUR_REVERSED_CLIENT_ID` with the reversed client ID from Firebase.

### Android Configuration

1. **Get SHA-1 fingerprint:**

```bash
cd android
./gradlew signingReport
```

Copy the SHA-1 fingerprint.

2. **Add to Firebase:**
   - Go to Firebase Console
   - Project Settings → General
   - Add your Android app
   - Add the SHA-1 fingerprint
   - Download `google-services.json`
   - Place it in `example/android/app/`

## Running the App

### Android

```bash
yarn android
# or
npm run android
```

### iOS

```bash
yarn ios
# or
npm run ios
```

## Available Examples

The example app includes multiple implementations:

1. **App.tsx** - Default component usage
2. **BasicExample.tsx** - Simplest implementation
3. **HookExample.tsx** - Using the hook
4. **CustomRenderExample.tsx** - Custom rendering
5. **DirectClientExample.tsx** - Direct client usage

### Switching Examples

To try different examples, modify `example/src/App.tsx`:

```typescript
// Default
export { default } from './App';

// Or try other examples
export { default } from './BasicExample';
export { default } from './HookExample';
export { default } from './CustomRenderExample';
export { default } from './DirectClientExample';
```

## Troubleshooting

### "Unable to resolve module"

```bash
cd example
yarn install
cd ..
yarn install
```

### "GoogleSignin configuration error"

Make sure you've configured Google Sign-In with a valid `webClientId`.

### "Failed to authenticate"

1. Check your Firebase configuration
2. Verify SHA-1 fingerprint is added (Android)
3. Ensure Info.plist is configured correctly (iOS)
4. Make sure you're using a TDMU Google account

### iOS Build Errors

```bash
cd example/ios
pod deintegrate
pod install
cd ../..
```

### Android Build Errors

```bash
cd example/android
./gradlew clean
cd ../..
```

## Testing with Different Accounts

To test with different accounts:

1. Sign out from the app
2. Go to device Settings → Google → Manage Google Account
3. Remove the account
4. Sign in with a different account

## Development

### Link Local Package

If you're developing the package locally:

```bash
# In the root directory
yarn

# The workspace setup will automatically link the package
```

### Hot Reloading

The example app supports hot reloading. Make changes to the source code and see them reflected immediately.

## Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)
- [Firebase Setup Guide](https://firebase.google.com/docs/guides)
- [TDMU Schedule Package Guide](../TDMU_SCHEDULE_PACKAGE_GUIDE.md)

## Support

For issues or questions:

- Open an issue on [GitHub](https://github.com/trungkoiiNe/react-native-t-schedule/issues)
- Check the [Usage Guide](../USAGE_GUIDE.md)
- Review the [README](../README.md)
