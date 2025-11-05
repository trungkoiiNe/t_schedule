# Quick Start Guide

Get up and running with react-native-t-schedule in 5 minutes!

## Step 1: Install (1 minute)

```bash
npm install react-native-t-schedule @react-native-async-storage/async-storage
```

or

```bash
yarn add react-native-t-schedule @react-native-async-storage/async-storage
```

## Step 2: Configure Your App (2 minutes)

### For Expo Projects (Recommended)

1. **Update your `app.json`** to include a custom scheme:

```json
{
  "expo": {
    "scheme": "your-app-scheme",
    "android": {
      "package": "com.yourcompany.yourapp"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    }
  }
}
```

### For Bare React Native Projects

The package automatically uses Expo modules. Ensure you have:

```bash
npx install-expo-modules@latest
```

## Step 3: Use the Component (30 seconds)

Replace your component code with:

```typescript
import React from 'react';
import { SafeAreaView } from 'react-native';
import { TDMUScheduleView } from 'react-native-t-schedule';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TDMUScheduleView />
    </SafeAreaView>
  );
}
```

## Step 5: Run Your App (1 minute)

```bash
# For iOS
npx react-native run-ios

# For Android
npx react-native run-android
```

## That's It! 🎉

You should now see:

1. A "Sign in with Google" button
2. After signing in, your TDMU schedule will load automatically
3. A beautiful list of your classes

## How It Works

This package:
1. ✅ Automatically fetches Google Client ID from TDMU API (`/authconfig`)
2. ✅ Uses **Expo AuthSession** with web client ID (no Android/iOS client needed)
3. ✅ Opens Google login in a secure web browser
4. ✅ Exchanges the ID token with TDMU to get access token
5. ✅ Fetches and displays your schedule

**No Firebase setup, no SHA-1 fingerprint, no Google Cloud Console access needed!**

## Next Steps

### Customize the Schedule Display

```typescript
<TDMUScheduleView
  onScheduleFetched={(schedule, semester) => {
    console.log('Got schedule!', schedule.length, 'classes');
  }}
/>
```

### Use Custom Rendering

```typescript
import { View, Text } from 'react-native';

<TDMUScheduleView
  renderScheduleItem={({ item }) => (
    <View style={{ padding: 16, backgroundColor: 'white', margin: 8 }}>
      <Text style={{ fontWeight: 'bold' }}>{item.tenMon}</Text>
      <Text>{item.thu} - Tiết {item.tiet}</Text>
    </View>
  )}
/>
```

### More Control with Hook

```typescript
import { useTDMUSchedule } from 'react-native-t-schedule';

function MyComponent() {
  const {
    schedule,
    isLoading,
    authenticate,
    fetchSchedule
  } = useTDMUSchedule();

  // Build your own UI with these values
  return (
    // Your custom UI here
  );
}
```

## Troubleshooting

### "Failed to authenticate"

- Double-check your Web Client ID
- Make sure you're using a TDMU Google account

### "Module not found"

```bash
rm -rf node_modules
npm install
# or
yarn install
```

### iOS Build Issues

```bash
cd ios && pod install && cd ..
```

## Learn More

- 📖 [Full Documentation](./README.md)
- 📚 [Usage Guide](./USAGE_GUIDE.md)
- 🏗️ [Architecture Guide](./TDMU_SCHEDULE_PACKAGE_GUIDE.md)
- 💻 [Example Code](./example)

## Support

Need help?

- Open an [issue](https://github.com/trungkoiiNe/react-native-t-schedule/issues)
- Check the [README](./README.md)

---

**Happy coding!** 🚀
