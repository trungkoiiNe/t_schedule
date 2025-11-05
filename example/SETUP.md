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

### Authentication Setup

**No complex setup required!** This example uses **Expo AuthSession** which:

✅ Automatically fetches Google Client ID from TDMU API  
✅ Works with web client ID only (no Android/iOS client needed)  
✅ No Firebase setup required  
✅ No SHA-1 fingerprint needed  
✅ No Google Cloud Console access required  

The app is already configured with:
- Custom scheme: `tschedule-example` (in `app.json`)
- Package name: `tschedule.example`
- Bundle ID: `tschedule.example`

### How It Works

1. App loads → fetches Google Client ID from `https://dkmh.tdmu.edu.vn/authconfig`
2. User clicks "Sign in" → opens Google login in secure browser
3. Google returns ID token → exchanged with TDMU API for access token
4. App fetches and displays schedule

That's it! No manual configuration needed.

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
