# Expo AuthSession Setup Guide for TDMU Schedule

Hướng dẫn chi tiết cách package này giải quyết vấn đề xác thực Google khi **không có quyền truy cập Google Cloud Console**.

## 🎯 Tổng Quan

Package này sử dụng **Expo AuthSession** với **Web Client ID** để thực hiện Google OAuth - hoàn toàn tương thích với hệ thống TDMU mà **không cần**:

- ❌ Android Client ID
- ❌ iOS Client ID  
- ❌ SHA-1 fingerprint
- ❌ Google Cloud Console access
- ❌ Firebase setup
- ❌ Keystore configuration

## 🔑 Cách Hoạt Động

### 1. Lấy Google Client ID Tự Động

Package tự động fetch Google Client ID từ TDMU API:

```typescript
// Tự động được thực hiện trong useTDMUSchedule hook
const { data } = await axios.get('https://dkmh.tdmu.edu.vn/authconfig');
const googleClientId = data.gg; // "79837717230-kttlrk5m6c41mps51smaofmf6j6jso6d.apps.googleusercontent.com"
```

### 2. OAuth Flow với Web Client ID

Expo AuthSession sử dụng **PKCE (Proof Key for Code Exchange)** - một phương thức OAuth an toàn cho mobile apps:

```typescript
const [request, response, promptAsync] = useIdTokenAuthRequest({
  webClientId: googleClientId,
  responseType: AuthSession.ResponseType.IdToken,
  scopes: ['openid', 'email', 'profile'],
});

// Mở Google login trong secure browser
await promptAsync();
```

### 3. Xác Thực với TDMU

Sau khi nhận ID token từ Google, package tự động gửi đến TDMU API:

```typescript
// Gửi ID token đến TDMU
const response = await axios.post(
  'https://dkmh.tdmu.edu.vn/public/api/auth/login',
  {
    username: 'user@gw',
    password: idToken, // Google ID token
    grant_type: 'password'
  }
);

// Nhận TDMU access token
const { access_token } = response.data;
```

## 📱 Setup Cho Dự Án Của Bạn

### Expo Projects (Recommended)

#### 1. Cài Đặt Dependencies

```bash
npm install react-native-t-schedule @react-native-async-storage/async-storage
# hoặc
yarn add react-native-t-schedule @react-native-async-storage/async-storage
```

#### 2. Cấu Hình `app.json`

Chỉ cần thêm custom scheme vào `app.json`:

```json
{
  "expo": {
    "name": "Your App",
    "slug": "your-app",
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

**Lưu ý:**
- `scheme` có thể là bất kỳ tên nào (lowercase, no spaces)
- Package name và bundle ID phải unique
- Không cần thêm Google OAuth redirect URIs

#### 3. Sử Dụng Package

```typescript
import { TDMUScheduleView } from 'react-native-t-schedule';

export default function App() {
  return <TDMUScheduleView />;
}
```

**Xong!** Không cần config thêm gì.

### Bare React Native Projects

#### 1. Cài Đặt Expo Modules

```bash
npx install-expo-modules@latest
```

#### 2. Cài Package

```bash
npm install react-native-t-schedule @react-native-async-storage/async-storage expo-auth-session expo-web-browser expo-crypto
```

#### 3. Cấu Hình Deep Linking

**Android:** Thêm vào `AndroidManifest.xml`

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="your-app-scheme" />
</intent-filter>
```

**iOS:** Thêm vào `Info.plist`

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>your-app-scheme</string>
    </array>
  </dict>
</array>
```

## 🎨 Các Cách Sử Dụng

### Cách 1: Component (Dễ Nhất)

```typescript
import { SafeAreaView } from 'react-native';
import { TDMUScheduleView } from 'react-native-t-schedule';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TDMUScheduleView 
        config={{
          cacheEnabled: true,
          cacheDuration: 3600000 // 1 hour
        }}
        onScheduleFetched={(schedule, semester) => {
          console.log('Schedule loaded:', schedule.length, 'items');
        }}
      />
    </SafeAreaView>
  );
}
```

### Cách 2: Hook (Flexible)

```typescript
import { useTDMUSchedule } from 'react-native-t-schedule';

export default function MySchedule() {
  const {
    isAuthenticated,
    isLoading,
    schedule,
    semester,
    error,
    authenticate,
    fetchSchedule,
    logout,
  } = useTDMUSchedule();

  if (!isAuthenticated) {
    return <Button title="Login" onPress={authenticate} />;
  }

  return (
    <FlatList
      data={schedule}
      renderItem={({ item }) => (
        <View>
          <Text>{item.tenMon}</Text>
        </View>
      )}
    />
  );
}
```

### Cách 3: Direct Client (Advanced)

```typescript
import { TDMUScheduleClient } from 'react-native-t-schedule';
import * as AuthSession from 'expo-auth-session';
import axios from 'axios';

async function loginAndFetchSchedule() {
  // 1. Get Google Client ID
  const { data } = await axios.get('https://dkmh.tdmu.edu.vn/authconfig');
  const googleClientId = data.gg;

  // 2. Configure OAuth
  const redirectUri = AuthSession.makeRedirectUri();
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  };

  // 3. Start OAuth flow
  const authUrl = `${discovery.authorizationEndpoint}?` +
    `client_id=${googleClientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=id_token&` +
    `scope=openid%20email%20profile&` +
    `nonce=${Math.random().toString(36)}`;

  const result = await AuthSession.startAsync({ authUrl });

  if (result.type === 'success') {
    const idToken = result.params.id_token;

    // 4. Authenticate with TDMU
    const client = new TDMUScheduleClient();
    await client.authenticateWithGoogle(idToken);

    // 5. Fetch schedule
    const schedule = await client.fetchCurrentSchedule();
    return schedule;
  }
}
```

## 🔍 Troubleshooting

### Lỗi: "Could not load Google Client ID"

**Nguyên nhân:** Không kết nối được với TDMU API

**Giải pháp:**
- Kiểm tra internet connection
- Thử truy cập https://dkmh.tdmu.edu.vn/authconfig trên browser
- Đợi vài giây rồi thử lại

### Lỗi: "OAuth request not ready"

**Nguyên nhân:** Hook chưa khởi tạo xong OAuth request

**Giải pháp:**
- Package tự động retry sau 1 giây
- Đảm bảo Google Client ID đã được load
- Kiểm tra console logs

### Lỗi: "Authentication cancelled"

**Nguyên nhân:** User đóng popup login

**Giải pháp:**
- Đây là hành vi bình thường
- User có thể thử lại bằng cách click "Login" lại

### Lỗi: "No ID token received"

**Nguyên nhân:** Google không trả về ID token

**Giải pháp:**
- Kiểm tra Google Client ID có hợp lệ không
- Đảm bảo `responseType: IdToken` được set
- Thử clear cache và login lại

## 🎯 Best Practices

### 1. Xử Lý Loading State

```typescript
const { isLoading, error } = useTDMUSchedule();

if (isLoading) {
  return <ActivityIndicator />;
}

if (error) {
  return (
    <View>
      <Text>Error: {error}</Text>
      <Button title="Retry" onPress={authenticate} />
    </View>
  );
}
```

### 2. Cache Schedule Data

```typescript
<TDMUScheduleView 
  config={{
    cacheEnabled: true,
    cacheDuration: 3600000 // 1 hour (recommended)
  }}
/>
```

### 3. Handle Schedule Fetched

```typescript
<TDMUScheduleView 
  onScheduleFetched={(schedule, semester) => {
    // Save to state, analytics, etc.
    Analytics.track('schedule_loaded', {
      semester: semester?.tenHocKy,
      itemCount: schedule.length
    });
  }}
/>
```

### 4. Custom Error Handling

```typescript
const { error, authenticate } = useTDMUSchedule();

useEffect(() => {
  if (error) {
    Alert.alert(
      'Lỗi Đăng Nhập',
      error,
      [
        { text: 'Thử Lại', onPress: authenticate },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  }
}, [error]);
```

## 🔐 Security Notes

### Package này an toàn vì:

1. **PKCE Flow:** Sử dụng PKCE (RFC 7636) - standard OAuth cho mobile
2. **No Client Secret:** Không cần client secret (không có hardcoded secrets)
3. **Secure Browser:** OAuth popup mở trong secure system browser
4. **Token Storage:** Access token được lưu an toàn trong AsyncStorage
5. **HTTPS Only:** Tất cả requests đều qua HTTPS

### Dữ liệu được lưu:

- `tdmu_access_token`: TDMU access token (for API calls)
- `tdmu_semesters`: Cached semester list
- `tdmu_schedule_*`: Cached schedule data

### Dữ liệu KHÔNG được lưu:

- ❌ Google password
- ❌ Google access token (chỉ dùng ID token)
- ❌ Personal info (trừ khi TDMU API trả về)

## 📚 Tài Liệu Thêm

- [Expo AuthSession Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [OAuth 2.0 PKCE](https://oauth.net/2/pkce/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

## 🆘 Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra [Troubleshooting](#troubleshooting) section
2. Xem example code trong `example/` folder
3. Mở issue trên [GitHub](https://github.com/trungkoiiNe/react-native-t-schedule/issues)

## 📝 Changelog

### v0.2.0
- ✅ Chuyển sang Expo AuthSession
- ✅ Tự động fetch Google Client ID
- ✅ Improved error handling
- ✅ Better retry logic
- ✅ Không cần Google Cloud Console

### v0.1.0
- Initial release với `@react-native-google-signin` (deprecated)

