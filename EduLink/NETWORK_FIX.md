# Troubleshooting: Network Request Failed

## Problem

When running the EduLink app on an Android emulator or device, login and all API calls fail with:

```
Login failed: network request failed
```

This happens for two reasons:

---

## Fix 1: Android Emulator Host Address

Android emulators cannot reach `localhost` — it points to the emulator's own loopback interface, not your host machine.

**Solution:** Use `10.0.2.2` which is the Android emulator's special alias for the host machine's `localhost`.

File: `src/services/api.ts`

```typescript
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine's localhost
// iOS simulator can use localhost directly
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = `http://${HOST}:3000/api`;
```

| Platform | Host Address | Maps To |
|----------|-------------|---------|
| iOS Simulator | `localhost` | Host machine localhost |
| Android Emulator | `10.0.2.2` | Host machine localhost |
| Android Device (USB) | Your machine's LAN IP | Host machine on same network |
| Android Device (WiFi) | Your machine's LAN IP | Host machine on same network |

> If testing on a **physical Android device** over WiFi, replace `10.0.2.2` with your computer's local IP (e.g., `192.168.1.100`).

---

## Fix 2: Android Cleartext Traffic

Android 9 (API 28) and above block cleartext (HTTP) traffic by default for security. Since the dev backend runs on HTTP, you must explicitly allow it.

File: `android/app/src/main/AndroidManifest.xml`

```xml
<application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:allowBackup="false"
    android:theme="@style/AppTheme"
    android:supportsRtl="true"
    android:usesCleartextTraffic="true">   <!-- ADD THIS LINE -->
```

> **Production note:** Remove `usesCleartextTraffic="true"` before publishing to Google Play. In production, use HTTPS with a real SSL certificate.

---

## Fix 3: Backend CORS

If the backend isn't running, or CORS is misconfigured, requests will fail.

File: `edulink-backend/.env`

```env
# Must include the port React Native Metro bundler runs on
CORS_ORIGINS=http://localhost:8081,http://localhost:3000,http://10.0.2.2:8081
```

The backend's `src/config/env.js` already splits this on commas and passes it to the `cors` middleware.

File: `edulink-backend/src/index.js`

```javascript
app.use(cors({
  origin: env.CORS_ORIGINS,
  credentials: true,
}));
```

---

## Quick Checklist

Before running the app, verify:

1. [ ] Backend is running: `cd edulink-backend && npm start`
2. [ ] Backend health check responds: `curl http://localhost:3000/api/health`
3. [ ] `api.ts` uses `10.0.2.2` for Android
4. [ ] `AndroidManifest.xml` has `usesCleartextTraffic="true"`
5. [ ] `.env` CORS origins include your Metro bundler port
6. [ ] Run `cd android && ./gradlew clean` after manifest changes

---

## Debugging Network Issues

### Check if backend is reachable from emulator

```bash
# From your terminal (host machine)
curl http://localhost:3000/api/health

# From Android emulator's browser, navigate to:
http://10.0.2.2:3000/api/health
```

### Check React Native's network logging

In your terminal where Metro is running, watch for errors. You can also enable network inspection:

```bash
npx react-native start --verbose
```

### Common metro.config.js for API proxy (optional)

If you want to avoid CORS entirely during development, you can proxy API requests through Metro:

```javascript
// metro.config.js
server: {
  proxy: {
    '/api': 'http://localhost:3000',
  },
},
```

Then use an empty base URL in your app (requests go to Metro which proxies to the backend).
