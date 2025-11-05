# react-native-t-schedule

Reusable React Native package for fetching TDMU (Thủ Dầu Một University) schedules with Google authentication using Expo AuthSession.

## Features

✅ **Easy Integration** - Simple to integrate into any React Native project  
✅ **Expo AuthSession** - Modern OAuth authentication without Google Cloud Console requirements  
✅ **Dynamic Client ID** - Automatically fetches Google OAuth config from TDMU  
✅ **Automatic Caching** - Built-in caching to reduce API calls  
✅ **TypeScript Support** - Full TypeScript definitions included  
✅ **Flexible Usage** - Use as a component, hook, or direct client  
✅ **Customizable UI** - Fully customizable schedule rendering

> 🇻🇳 **Vietnamese Guide:** [Hướng dẫn Best Fix (Tiếng Việt)](./FIX_SUMMARY_VI.md)

## Installation

```bash
npm install react-native-t-schedule
# or
yarn add react-native-t-schedule
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install @react-native-async-storage/async-storage axios expo-auth-session expo-web-browser expo-crypto
# or
yarn add @react-native-async-storage/async-storage axios expo-auth-session expo-web-browser expo-crypto
```

## Setup

### 1. Configure Expo for OAuth

If you're using Expo, update your `app.json`:

```json
{
  "expo": {
    "name": "your-app",
    "scheme": "your-app-scheme",
    "plugins": ["expo-router"]
  }
}
```

### 2. No Google Cloud Console Required!

This package uses **Expo AuthSession** with TDMU's public Google OAuth configuration, so you don't need to:

- ❌ Set up Google Cloud Console project
- ❌ Configure OAuth consent screen
- ❌ Add SHA-1 fingerprints
- ❌ Create Android/iOS Client IDs
- ❌ Manage OAuth credentials

The authentication flow automatically uses the university's Google OAuth settings.

📖 **[Read the Complete Expo AuthSession Setup Guide](./EXPO_AUTH_SETUP_GUIDE.md)**

### 3. Platform-Specific Setup

#### iOS & Android

No additional setup required! Expo AuthSession handles all native configuration automatically.

## Usage

### Method 1: Component (Easiest)

The simplest way to integrate TDMU schedule fetching:

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

#### With Configuration

```typescript
import { TDMUScheduleView } from 'react-native-t-schedule';
import type { ScheduleItem, Semester } from 'react-native-t-schedule';

function App() {
  const handleScheduleFetched = (schedule: ScheduleItem[], semester: Semester | null) => {
    console.log('Schedule fetched!', schedule.length, 'items');
  };

  return (
    <TDMUScheduleView
      config={{
        tdmuUsername: 'user@gw',
        cacheEnabled: true,
        cacheDuration: 3600000, // 1 hour
      }}
      onScheduleFetched={handleScheduleFetched}
    />
  );
}
```

#### With Custom Rendering

```typescript
import { View, Text } from 'react-native';
import { TDMUScheduleView } from 'react-native-t-schedule';
import type { ScheduleItem } from 'react-native-t-schedule';

function App() {
  const renderScheduleItem = ({ item }: { item: ScheduleItem }) => (
    <View style={styles.customCard}>
      <Text style={styles.courseCode}>{item.maMon || item.courseCode}</Text>
      <Text style={styles.courseName}>{item.tenMon || item.courseName}</Text>
      <Text>{item.thu || item.dayOfWeek} - Tiết {item.tiet || item.period}</Text>
      <Text>📍 {item.phong || item.room}</Text>
    </View>
  );

  return (
    <TDMUScheduleView renderScheduleItem={renderScheduleItem} />
  );
}
```

### Method 2: Hook (More Control)

For more control over the authentication and fetching process:

```typescript
import React from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { useTDMUSchedule } from 'react-native-t-schedule';

function MyScheduleScreen() {
  const {
    isAuthenticated,
    isLoading,
    schedule,
    semester,
    error,
    authenticate,
    fetchSchedule,
    logout,
  } = useTDMUSchedule({
    tdmuUsername: 'user@gw',
    cacheEnabled: true,
  });

  if (!isAuthenticated) {
    return (
      <View>
        <Button title="Login with Google" onPress={authenticate} />
      </View>
    );
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      <Text>Semester: {semester?.tenHocKy || semester?.semesterName}</Text>
      <Button title="Refresh" onPress={fetchSchedule} />
      <Button title="Logout" onPress={logout} />

      <FlatList
        data={schedule}
        renderItem={({ item }) => (
          <View>
            <Text>{item.tenMon}</Text>
            <Text>{item.thu} - Tiết {item.tiet}</Text>
          </View>
        )}
      />
    </View>
  );
}
```

### Method 3: Direct Client (Most Control)

For complete control over the authentication flow:

```typescript
import { TDMUScheduleClient } from 'react-native-t-schedule';
import * as AuthSession from 'expo-auth-session';
import axios from 'axios';

async function fetchMySchedule() {
  const client = new TDMUScheduleClient({
    tdmuUsername: 'user@gw',
    cacheEnabled: true,
    cacheDuration: 3600000,
  });

  try {
    // 1️⃣ Get Google client ID from TDMU
    const { data } = await axios.get('https://dkmh.tdmu.edu.vn/authconfig');
    const clientId = data.gg;

    // 2️⃣ Start Google OAuth flow
    const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `response_type=id_token&` +
      `scope=openid%20email%20profile&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `nonce=${Math.random().toString(36).substring(2)}`;

    const result = await AuthSession.startAsync({ authUrl });

    if (result.type !== 'success') {
      throw new Error('Login cancelled');
    }

    const idToken = result.params.id_token;

    // 3️⃣ Authenticate with TDMU using Google ID token
    await client.authenticateWithGoogle(idToken);

    // Fetch current schedule
    const scheduleResult = await client.fetchCurrentSchedule();

    console.log('Schedule:', scheduleResult.schedule);
    console.log('Semester:', scheduleResult.semester);

    return scheduleResult;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## API Reference

### TDMUScheduleClient

#### Constructor

```typescript
new TDMUScheduleClient(config?: TDMUConfig)
```

**Config Options:**

- `baseURL` (string): TDMU API base URL. Default: `'https://dkmh.tdmu.edu.vn/api'`
- `tdmuUsername` (string): TDMU username. Default: `'user@gw'`
- `cacheEnabled` (boolean): Enable caching. Default: `true`
- `cacheDuration` (number): Cache duration in ms. Default: `3600000` (1 hour)

#### Methods

##### `authenticateWithGoogle(googleIdToken: string): Promise<TDMUAuthResponse>`

Authenticate with TDMU using Google ID token.

##### `getAuthConfig(): Promise<{ gg: string; logoff: boolean; timeout: number }>`

Get TDMU authentication configuration including Google client ID.

##### `validateAccess(): Promise<any>`

Validate user's access to TDMU functions.

##### `getSemesters(): Promise<Semester[]>`

Get list of available semesters.

##### `getSchedule(semesterId: string | number, userId?: string): Promise<ScheduleItem[]>`

Get schedule for a specific semester.

##### `fetchCurrentSchedule(): Promise<ScheduleResult>`

Fetch schedule for the current semester (complete flow).

##### `clearCache(): Promise<void>`

Clear all cached data.

##### `logout(): Promise<void>`

Logout and clear all data.

---

### useTDMUSchedule Hook

```typescript
const {
  isAuthenticated,
  isLoading,
  schedule,
  semester,
  error,
  authenticate,
  fetchSchedule,
  fetchScheduleForSemester,
  fetchSemesters,
  logout,
  clearCache
} = useTDMUSchedule(config?: TDMUConfig);
```

**Returns:**

**State:**

- `isAuthenticated` (boolean): Authentication status
- `isLoading` (boolean): Loading state
- `schedule` (ScheduleItem[] | null): Schedule data
- `semester` (Semester | null): Current semester info
- `error` (string | null): Error message

**Actions:**

- `authenticate()`: Authenticate with Google
- `fetchSchedule()`: Fetch current schedule
- `fetchScheduleForSemester(semesterId)`: Fetch specific semester
- `fetchSemesters()`: Get available semesters
- `logout()`: Logout user
- `clearCache()`: Clear cached data

---

### TDMUScheduleView Component

```typescript
<TDMUScheduleView
  config?: TDMUConfig
  onScheduleFetched?: (schedule: ScheduleItem[], semester: Semester | null) => void
  renderScheduleItem?: (info: { item: ScheduleItem }) => React.ReactElement
  style?: ViewStyle
/>
```

**Props:**

- `config`: Configuration options (same as TDMUScheduleClient)
- `onScheduleFetched`: Callback when schedule is fetched
- `renderScheduleItem`: Custom render function for schedule items
- `style`: Custom container style

## Types

### ScheduleItem

```typescript
interface ScheduleItem {
  id?: string;
  maMon?: string; // Course code
  courseCode?: string;
  tenMon?: string; // Course name
  courseName?: string;
  thu?: string; // Day of week
  dayOfWeek?: string;
  tiet?: string; // Period
  period?: string;
  phong?: string; // Room
  room?: string;
  giangVien?: string; // Instructor
  instructor?: string;
}
```

### Semester

```typescript
interface Semester {
  id?: string;
  hocKyId?: string;
  tenHocKy?: string; // Semester name
  semesterName?: string;
}
```

### ScheduleResult

```typescript
interface ScheduleResult {
  semester: Semester;
  schedule: ScheduleItem[];
  fetchedAt: string; // ISO timestamp
}
```

## Examples

Check the `/example` directory for complete working examples:

- **BasicExample.tsx** - Simple component usage
- **HookExample.tsx** - Using the hook
- **CustomRenderExample.tsx** - Custom rendering
- **DirectClientExample.tsx** - Direct client usage

## Troubleshooting

### "Failed to authenticate with TDMU system"

**Solution:** Ensure Google Access Token is valid and not expired. Check your Google Sign-In configuration.

### "No semesters available"

**Solution:** Verify the user has access to the TDMU system and is properly authenticated.

### Cache not working

**Solution:** Check AsyncStorage permissions and storage availability on the device.

### Google Sign-In fails

**Solution:** Verify `webClientId` in GoogleSignin.configure() and ensure Firebase setup is correct.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

TrungDev - [GitHub](https://github.com/trungkoiiNe)

## Acknowledgments

This package is designed to work with the TDMU (Thủ Dầu Một University) academic system.
