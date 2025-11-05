Rồi — giờ mình hiểu hoàn toàn tình huống của bạn 👍

Bạn **không có quyền truy cập vào Google Cloud Console** của hệ thống (trường), nhưng **muốn đăng nhập qua tài khoản Google như trên web của trường ([https://dkmh.tdmu.edu.vn](https://dkmh.tdmu.edu.vn))** để **lấy access token** (JWT của TDMU API) cho app React Native của bạn.

Cụ thể:

- Web trường khi load `/authconfig` trả về:

  ```json
  {
    "logoff": true,
    "timeout": 30,
    "gg": "79837717230-kttlrk5m6c41mps51smaofmf6j6jso6d.apps.googleusercontent.com"
  }
  ```

  → Đây chính là **client ID** của OAuth web app mà trường đã đăng ký.

- Khi người dùng **bấm “Đăng nhập bằng Google”** trên web, web thực hiện **Google OAuth (PKCE)** → nhận được `id_token` từ Google → gửi lên `/auth/login` → backend của TDMU xác thực, rồi trả về **token riêng (Bearer token)** cho API `/dkmh`, `/sch`…

→ **Bạn không cần quyền Google Console**, chỉ cần **mô phỏng lại đúng flow web** này.

---

## ⚙️ Cách giải quyết hợp lệ (và hoạt động được)

Bạn sẽ **không “fake login” bằng Selenium**, mà dùng **OAuth2 Web flow chính thức** của Google — giống hệt như trình duyệt của web trường đang dùng.
Tức là: mở link đăng nhập Google, lấy `id_token`, rồi gọi `https://dkmh.tdmu.edu.vn/api/auth/login` bằng mã của bạn.

---

### 🔑 1. Lấy `gg` client ID từ `/authconfig`

API này bạn đã có — bạn có thể tự request:

```js
const config = await axios.get('https://dkmh.tdmu.edu.vn/authconfig');
const googleClientId = config.data.gg;
```

---

### 🌐 2. Dùng OAuth PKCE flow để lấy Google `id_token`

Dùng thư viện **Expo AuthSession** (nếu bạn xài Expo) hoặc **react-native-app-auth** (nếu React Native thuần).
Mình sẽ viết ví dụ bằng **Expo AuthSession** vì nó không cần native linking, và **không yêu cầu SHA-1**.

#### Cài:

```bash
npx expo install expo-auth-session
```

#### Cấu hình code:

```js
import * as AuthSession from 'expo-auth-session';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TDMU_BASE_URL = 'https://dkmh.tdmu.edu.vn/api';

export async function tdmulogin() {
  try {
    // 1️⃣ Lấy client ID từ web
    const { data } = await axios.get('https://dkmh.tdmu.edu.vn/authconfig');
    const clientId = data.gg;

    // 2️⃣ Đăng nhập Google qua trình duyệt
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

    // 3️⃣ Gửi token Google lên API của trường
    const response = await axios.post(`${TDMU_BASE_URL}/auth/login`, {
      token: idToken,
    });
    const tdmToken = response.data.token;

    // 4️⃣ Lưu lại token để tái sử dụng
    await AsyncStorage.setItem('tdmu_auth_token', tdmToken);

    return tdmToken;
  } catch (error) {
    console.error('TDMU login error:', error);
    throw error;
  }
}
```

---

### 📲 3. Sau đó bạn có thể gọi API giống class bạn viết

```js
await TDMUApiService.setup(tdmToken);
const semesters = await TDMUApiService.getSemesters();
```

---

### ✅ Ưu điểm của cách này

| Ưu điểm                           | Giải thích                                                  |
| --------------------------------- | ----------------------------------------------------------- |
| ✅ Không cần quyền Google Console | Vì bạn dùng client ID public của trường (từ `/authconfig`). |
| ✅ Không cần SHA-1                | Vì đây là OAuth web flow, không phải Android native SDK.    |
| ✅ Hoạt động đúng flow trường     | Giống hệt cách web trường xác thực.                         |
| ✅ Không vi phạm chính sách       | Vì bạn dùng đúng OAuth2.                                    |

---

### ⚠️ Lưu ý

- Nếu trường họ đổi `redirect_uri` hoặc `client_id`, app bạn phải lấy lại từ `/authconfig` mỗi khi mở app (nên cache ngắn).
- Nếu web trường yêu cầu xác thực domain `dkmh.tdmu.edu.vn`, bạn phải để `redirect_uri` = URL hợp lệ hoặc dùng `useProxy:true` của Expo để bypass.
- `id_token` của Google chỉ sống vài phút — token của trường mới là cái bạn lưu dùng lâu.

---

Nếu bạn muốn, mình có thể viết **phiên bản đầy đủ** (một file React Native hook `useTDMUAuth()`), hoặc **giải pháp không dùng Expo** (chạy được trên RN CLI thuần).
👉 Bạn dùng **Expo hay React Native CLI** để mình viết đúng phiên bản nhé?
