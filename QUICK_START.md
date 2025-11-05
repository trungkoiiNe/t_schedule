# Quick Start Guide

Get up and running with react-native-t-schedule in 5 minutes!

## Step 1: Install (1 minute)

```bash
npm install react-native-t-schedule @react-native-async-storage/async-storage @react-native-google-signin/google-signin axios
```

or

```bash
yarn add react-native-t-schedule @react-native-async-storage/async-storage @react-native-google-signin/google-signin axios
```

## Step 2: Get Your Web Client ID (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one if needed)
3. Click the gear icon → **Project Settings**
4. Scroll down to **Your apps** section
5. Copy the **Web client ID**

It looks like: `123456789-abcdefg.apps.googleusercontent.com`

## Step 3: Configure Google Sign-In (30 seconds)

In your `App.tsx` or `index.js`, add at the top:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Paste your Web Client ID here
  offlineAccess: true,
});
```

## Step 4: Use the Component (30 seconds)

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
