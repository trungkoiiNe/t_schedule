# Usage Guide for react-native-t-schedule

This guide provides detailed instructions and best practices for using the TDMU Schedule Fetcher package.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Configuration](#configuration)
3. [Authentication Flow](#authentication-flow)
4. [Fetching Schedules](#fetching-schedules)
5. [Caching](#caching)
6. [Error Handling](#error-handling)
7. [Customization](#customization)
8. [Best Practices](#best-practices)

---

## Quick Start

### 1. Install Dependencies

```bash
yarn add react-native-t-schedule @react-native-async-storage/async-storage @react-native-google-signin/google-signin axios
```

### 2. Configure Google Sign-In

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  offlineAccess: true,
});
```

### 3. Use the Component

```typescript
import { TDMUScheduleView } from 'react-native-t-schedule';

function App() {
  return <TDMUScheduleView />;
}
```

---

## Configuration

### Default Configuration

```typescript
{
  baseURL: 'https://dkmh.tdmu.edu.vn/api',
  tdmuUsername: 'user@gw',
  cacheEnabled: true,
  cacheDuration: 3600000, // 1 hour in milliseconds
}
```

### Custom Configuration

```typescript
const customConfig = {
  baseURL: 'https://dkmh.tdmu.edu.vn/api',
  tdmuUsername: 'user@gw',
  cacheEnabled: true,
  cacheDuration: 7200000, // 2 hours
};

<TDMUScheduleView config={customConfig} />
```

---

## Authentication Flow

The package handles authentication in several steps:

### Step 1: Google OAuth

```typescript
const { authenticate } = useTDMUSchedule();

// This will:
// 1. Open Google Sign-In
// 2. Get Google access token
// 3. Pass token to TDMU authentication
await authenticate();
```

### Step 2: TDMU Authentication

The package automatically:

1. Sends Google access token to TDMU API
2. Receives TDMU access token
3. Stores token in AsyncStorage
4. Sets authorization header for future requests

### Manual Authentication (Direct Client)

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { TDMUScheduleClient } from 'react-native-t-schedule';

const client = new TDMUScheduleClient();

// Get Google token
await GoogleSignin.signIn();
const tokens = await GoogleSignin.getTokens();

// Authenticate with TDMU
await client.authenticateWithGoogle(tokens.accessToken);
```

---

## Fetching Schedules

### Fetch Current Semester Schedule

```typescript
const { fetchSchedule } = useTDMUSchedule();

const result = await fetchSchedule();
// Returns: { semester, schedule, fetchedAt }
```

### Fetch Specific Semester Schedule

```typescript
const { fetchScheduleForSemester } = useTDMUSchedule();

const schedule = await fetchScheduleForSemester('20231');
```

### Get Available Semesters

```typescript
const { fetchSemesters } = useTDMUSchedule();

const semesters = await fetchSemesters();
// Returns: Array of semester objects
```

### Direct Client Usage

```typescript
const client = new TDMUScheduleClient();

// After authentication...

// Get semesters
const semesters = await client.getSemesters();

// Get specific schedule
const schedule = await client.getSchedule(semesters[0].id);

// Or get current schedule (does everything)
const result = await client.fetchCurrentSchedule();
```

---

## Caching

### How Caching Works

1. **First Request**: Fetches from API, stores in AsyncStorage
2. **Subsequent Requests**: Returns cached data if not expired
3. **Expired Cache**: Automatically fetches fresh data

### Cache Keys

- Semesters: `tdmu_semesters`
- Schedule: `tdmu_schedule_{semesterId}_{userId}`
- Token: `tdmu_access_token`

### Manual Cache Management

```typescript
const { clearCache } = useTDMUSchedule();

// Clear all cached data
await clearCache();
```

```typescript
// Direct client
const client = new TDMUScheduleClient();
await client.clearCache();
```

### Disable Caching

```typescript
const config = {
  cacheEnabled: false,
};

<TDMUScheduleView config={config} />
```

### Custom Cache Duration

```typescript
const config = {
  cacheDuration: 1800000, // 30 minutes
};

<TDMUScheduleView config={config} />
```

---

## Error Handling

### Using the Hook

```typescript
const { error, isLoading } = useTDMUSchedule();

if (error) {
  console.error('Error:', error);
  // Display error to user
}
```

### Try-Catch with Direct Client

```typescript
try {
  const result = await client.fetchCurrentSchedule();
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);

  if (error.message.includes('authenticate')) {
    // Handle authentication error
  } else if (error.message.includes('network')) {
    // Handle network error
  }
}
```

### Common Errors

| Error                               | Cause                | Solution               |
| ----------------------------------- | -------------------- | ---------------------- |
| "Failed to authenticate"            | Invalid Google token | Re-authenticate        |
| "No semesters available"            | No access to TDMU    | Check user permissions |
| "Network request failed"            | No internet          | Check connection       |
| "Failed to get Google access token" | Google Sign-In issue | Check configuration    |

---

## Customization

### Custom Schedule Item Rendering

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { TDMUScheduleView } from 'react-native-t-schedule';

function MyApp() {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.code}>{item.maMon}</Text>
        <Text style={styles.room}>{item.phong}</Text>
      </View>
      <Text style={styles.name}>{item.tenMon}</Text>
      <Text style={styles.time}>
        {item.thu} - Tiết {item.tiet}
      </Text>
      <Text style={styles.instructor}>
        👨‍🏫 {item.giangVien}
      </Text>
    </View>
  );

  return <TDMUScheduleView renderScheduleItem={renderItem} />;
}
```

### Custom Container Style

```typescript
<TDMUScheduleView
  style={{
    flex: 1,
    backgroundColor: '#f0f0f0',
  }}
/>
```

### Callbacks

```typescript
<TDMUScheduleView
  onScheduleFetched={(schedule, semester) => {
    console.log('Fetched:', schedule.length, 'items');
    console.log('Semester:', semester?.tenHocKy);

    // Save to local state
    // Send analytics
    // Show notification
  }}
/>
```

### Building Your Own UI

```typescript
import { useTDMUSchedule } from 'react-native-t-schedule';

function MyCustomScheduleUI() {
  const {
    isAuthenticated,
    isLoading,
    schedule,
    semester,
    authenticate,
    fetchSchedule,
    logout,
  } = useTDMUSchedule();

  // Build your own UI with complete control
  return (
    <YourCustomComponent
      authenticated={isAuthenticated}
      loading={isLoading}
      data={schedule}
      semesterInfo={semester}
      onLogin={authenticate}
      onRefresh={fetchSchedule}
      onLogout={logout}
    />
  );
}
```

---

## Best Practices

### 1. Initialize Google Sign-In Early

```typescript
// In App.tsx or index.js
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure before rendering any components
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID',
  offlineAccess: true,
});
```

### 2. Handle Errors Gracefully

```typescript
const { error, authenticate } = useTDMUSchedule();

if (error) {
  return (
    <View>
      <Text>Something went wrong</Text>
      <Text>{error}</Text>
      <Button title="Try Again" onPress={authenticate} />
    </View>
  );
}
```

### 3. Show Loading States

```typescript
const { isLoading } = useTDMUSchedule();

if (isLoading) {
  return (
    <View>
      <ActivityIndicator size="large" />
      <Text>Loading your schedule...</Text>
    </View>
  );
}
```

### 4. Use Caching for Better Performance

```typescript
// Enable caching (default: true)
const config = {
  cacheEnabled: true,
  cacheDuration: 3600000, // 1 hour
};
```

### 5. Implement Refresh Functionality

```typescript
const { fetchSchedule, isLoading } = useTDMUSchedule();

<RefreshControl
  refreshing={isLoading}
  onRefresh={fetchSchedule}
/>
```

### 6. Clear Cache on Logout

```typescript
const { logout, clearCache } = useTDMUSchedule();

const handleLogout = async () => {
  await clearCache();
  await logout();
};
```

### 7. Validate Before Fetching

```typescript
const { isAuthenticated, authenticate, fetchSchedule } = useTDMUSchedule();

const handleFetch = async () => {
  if (!isAuthenticated) {
    await authenticate();
  }
  await fetchSchedule();
};
```

### 8. Use TypeScript Types

```typescript
import type {
  ScheduleItem,
  Semester,
  TDMUConfig,
} from 'react-native-t-schedule';

const config: TDMUConfig = {
  cacheEnabled: true,
};

const handleSchedule = (
  schedule: ScheduleItem[],
  semester: Semester | null
) => {
  // Type-safe handling
};
```

### 9. Implement Analytics

```typescript
<TDMUScheduleView
  onScheduleFetched={(schedule, semester) => {
    analytics.logEvent('schedule_fetched', {
      semester: semester?.tenHocKy,
      itemCount: schedule.length,
    });
  }}
/>
```

### 10. Handle Network Issues

```typescript
import NetInfo from '@react-native-community/netinfo';

const { fetchSchedule } = useTDMUSchedule();

const handleFetch = async () => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    Alert.alert('No Internet', 'Please check your connection');
    return;
  }

  await fetchSchedule();
};
```

---

## Advanced Usage

### Multiple Semester Views

```typescript
function MultiSemesterView() {
  const { fetchScheduleForSemester, fetchSemesters } = useTDMUSchedule();
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [semesters, setSemesters] = useState([]);

  useEffect(() => {
    fetchSemesters().then(setSemesters);
  }, []);

  const handleSelectSemester = async (semesterId) => {
    setSelectedSemester(semesterId);
    await fetchScheduleForSemester(semesterId);
  };

  return (
    <View>
      <Picker
        selectedValue={selectedSemester}
        onValueChange={handleSelectSemester}
      >
        {semesters.map(sem => (
          <Picker.Item key={sem.id} label={sem.tenHocKy} value={sem.id} />
        ))}
      </Picker>
      {/* Schedule display */}
    </View>
  );
}
```

### Persist Authentication State

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if token exists on app start
useEffect(() => {
  AsyncStorage.getItem('tdmu_access_token').then((token) => {
    if (token) {
      // User is already authenticated
      fetchSchedule();
    }
  });
}, []);
```

---

## Support

For issues, questions, or contributions, please visit:
https://github.com/trungkoiiNe/react-native-t-schedule

---

**Last Updated**: November 5, 2025
