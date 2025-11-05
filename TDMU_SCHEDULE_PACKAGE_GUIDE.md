# TDMU Schedule Fetching Package - Complete Guide

## Executive Summary

This document explains the architecture for fetching schedules from the TDMU (Thủ Dầu Một University) system and provides a blueprint for building a reusable package. The package enables users to authenticate with their Google account and retrieve their academic schedules from the TDMU API.

---

## Current Architecture Analysis

### 1. Understanding the Codebase Structure

The current EduEvent project has **TWO SEPARATE SYSTEMS**:

#### System A: Firebase/Firestore (Event Management)

- **Purpose**: Managing app-specific events (not TDMU schedules)
- **Location**: `src/Screens/Schedules/Schedule.js`
- **What it does**: Fetches events that users have registered for within the EduEvent app
- **Data Source**: Firebase Firestore → `USER/{userId}/registeredEvents`

#### System B: TDMU API Integration (Schedule Fetching)

- **Purpose**: Fetching actual academic schedules from TDMU university system
- **Location**: `src/api/TDMUApiService.js`, `src/Screens/Auth/LoginScreen.js`
- **What it does**: Authenticates with TDMU and fetches university schedules
- **Data Source**: TDMU API → `https://dkmh.tdmu.edu.vn/api`

> **IMPORTANT**: `Schedule.js` does NOT fetch from TDMU API. It fetches from Firebase. The TDMU schedule fetching is handled separately through the API service.

---

## TDMU Schedule Fetching Flow

### Method 1: API-Based Authentication (Recommended)

This is the primary method used in `LoginScreen.js`:

```
┌─────────────────────────────────────────────────────────────┐
│                    TDMU Schedule Fetch Flow                  │
└─────────────────────────────────────────────────────────────┘

Step 1: Google OAuth Authentication
┌──────────────────────────┐
│  User clicks             │
│  "Sign in with Google"   │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  GoogleSignin.signIn()   │
│  Returns:                │
│  - idToken              │
│  - accessToken          │
└──────────┬───────────────┘
           │
           ▼
Step 2: TDMU Authentication
┌──────────────────────────────────────────┐
│  POST https://dkmh.tdmu.edu.vn/api/auth/login  │
│  Content-Type: application/x-www-form-urlencoded │
│                                          │
│  Body:                                   │
│  ├─ username: 'user@gw'                 │
│  ├─ password: <Google Access Token>     │
│  └─ grant_type: 'password'              │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────┐
│  Receive TDMU Token      │
│  {                       │
│    access_token: "..."   │
│    token_type: "Bearer"  │
│  }                       │
└──────────┬───────────────┘
           │
           ▼
Step 3: Validate Access
┌──────────────────────────────────────────┐
│  GET /dkmh/w-checkvalidallchucnang       │
│  Authorization: Bearer <TDMU_TOKEN>      │
└──────────┬───────────────────────────────┘
           │
           ▼
Step 4: Get Semester List
┌──────────────────────────────────────────┐
│  GET /sch/w-locdshockytkbuser            │
│  Authorization: Bearer <TDMU_TOKEN>      │
│  Returns: List of semesters              │
└──────────┬───────────────────────────────┘
           │
           ▼
Step 5: Get Calendar/Schedule
┌──────────────────────────────────────────┐
│  GET /sch/w-locdstkbtuanusertheohocky    │
│  Authorization: Bearer <TDMU_TOKEN>      │
│  Params:                                 │
│  ├─ hocky: <semester_id>                │
│  └─ user: <user_id> (optional)          │
│                                          │
│  Returns: Complete schedule data         │
└──────────────────────────────────────────┘
```

### Method 2: WebView Interception (Alternative)

Used in `TDMUWebViewAuth.js` - Opens TDMU website in WebView and intercepts API calls:

```
┌─────────────────────────────────────────────────────────────┐
│                  WebView Interception Flow                   │
└─────────────────────────────────────────────────────────────┘

Step 1: Open WebView
┌──────────────────────────┐
│  Load dkmh.tdmu.edu.vn   │
│  in React Native WebView │
└──────────┬───────────────┘
           │
           ▼
Step 2: User Logs In
┌──────────────────────────┐
│  User signs in with      │
│  Google in WebView       │
└──────────┬───────────────┘
           │
           ▼
Step 3: Navigate to Schedule
┌──────────────────────────────┐
│  Auto-navigate to:           │
│  /TraCuu/ThoiKhoaBieu        │
└──────────┬───────────────────┘
           │
           ▼
Step 4: Intercept API Call
┌──────────────────────────────────────┐
│  Inject JavaScript to intercept:     │
│  /sch/w-locdstkbtuanusertheohocky    │
│                                      │
│  window.fetch = async (url, opts) => │
│    if (url.includes('w-locds...'))   │
│      postMessage(response.data)      │
└──────────┬───────────────────────────┘
           │
           ▼
Step 5: Extract Data
┌──────────────────────────┐
│  Receive schedule data   │
│  in React Native app     │
└──────────────────────────┘
```

---

## Building a Reusable Package

### Package Structure

```
tdmu-schedule-fetcher/
├── src/
│   ├── index.js                    # Main export
│   ├── TDMUScheduleClient.js       # Core API client
│   ├── auth/
│   │   ├── GoogleAuthHandler.js    # Google OAuth handling
│   │   └── TDMUAuthHandler.js      # TDMU authentication
│   ├── api/
│   │   ├── endpoints.js            # API endpoint definitions
│   │   └── interceptors.js         # Request/Response interceptors
│   ├── hooks/
│   │   ├── useScheduleFetch.js     # React hook for fetching
│   │   └── useTDMUAuth.js          # React hook for auth
│   ├── components/
│   │   ├── TDMULoginButton.js      # Reusable login button
│   │   └── ScheduleList.js         # Schedule display component
│   └── utils/
│       ├── cache.js                # Caching utilities
│       └── formatters.js           # Data formatters
├── package.json
├── README.md
└── example/                        # Example implementation
    └── App.js
```

### Core Implementation

#### 1. TDMUScheduleClient.js (Main Client)

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class TDMUScheduleClient {
  constructor(config = {}) {
    this.config = {
      baseURL: config.baseURL || 'https://dkmh.tdmu.edu.vn/api',
      tdmuUsername: config.tdmuUsername || 'user@gw',
      cacheEnabled: config.cacheEnabled !== false,
      cacheDuration: config.cacheDuration || 3600000, // 1 hour
      ...config,
    };

    this.api = axios.create({
      baseURL: this.config.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; TDMUScheduleFetcher/1.0)',
      },
    });

    this._setupInterceptors();
  }

  _setupInterceptors() {
    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(
          'TDMU API Error:',
          error?.response?.data || error?.message
        );
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate with TDMU using Google Access Token
   * @param {string} googleAccessToken - Google OAuth access token
   * @returns {Promise<Object>} TDMU authentication data
   */
  async authenticateWithGoogle(googleAccessToken) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', this.config.tdmuUsername);
      formData.append('password', googleAccessToken);
      formData.append('grant_type', 'password');

      const response = await axios.post(
        `${this.config.baseURL}/auth/login`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, token_type } = response.data;

      // Store token
      await AsyncStorage.setItem('tdmu_access_token', access_token);

      // Set authorization header for future requests
      this.api.defaults.headers.common['Authorization'] =
        `${token_type} ${access_token}`;

      return response.data;
    } catch (error) {
      console.error('TDMU Authentication Failed:', error);
      throw new Error('Failed to authenticate with TDMU system');
    }
  }

  /**
   * Validate user's access to TDMU functions
   * @returns {Promise<Object>} Validation response
   */
  async validateAccess() {
    try {
      const response = await this.api.get('/dkmh/w-checkvalidallchucnang');
      return response.data;
    } catch (error) {
      console.error('Access validation failed:', error);
      throw error;
    }
  }

  /**
   * Get list of available semesters
   * @returns {Promise<Array>} List of semesters
   */
  async getSemesters() {
    try {
      const cacheKey = 'tdmu_semesters';

      // Check cache
      if (this.config.cacheEnabled) {
        const cached = await this._getFromCache(cacheKey);
        if (cached) return cached;
      }

      const response = await this.api.get('/sch/w-locdshockytkbuser');

      // Cache result
      if (this.config.cacheEnabled) {
        await this._saveToCache(cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to fetch semesters:', error);
      throw error;
    }
  }

  /**
   * Get schedule/calendar for a specific semester
   * @param {string|number} semesterId - Semester ID
   * @param {string} userId - Optional user ID
   * @returns {Promise<Object>} Schedule data
   */
  async getSchedule(semesterId, userId = null) {
    try {
      const params = { hocky: semesterId };
      if (userId) params.user = userId;

      const cacheKey = `tdmu_schedule_${semesterId}_${userId || 'current'}`;

      // Check cache
      if (this.config.cacheEnabled) {
        const cached = await this._getFromCache(cacheKey);
        if (cached) return cached;
      }

      const response = await this.api.get('/sch/w-locdstkbtuanusertheohocky', {
        params,
      });

      // Cache result
      if (this.config.cacheEnabled) {
        await this._saveToCache(cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      throw error;
    }
  }

  /**
   * Complete flow: Fetch current semester's schedule
   * @returns {Promise<Object>} Schedule and semester info
   */
  async fetchCurrentSchedule() {
    try {
      // Validate access
      await this.validateAccess();

      // Get semesters
      const semesters = await this.getSemesters();
      if (!semesters || semesters.length === 0) {
        throw new Error('No semesters available');
      }

      // Get current semester (first one is usually current)
      const currentSemester = semesters[0];

      // Fetch schedule
      const schedule = await this.getSchedule(
        currentSemester.id || currentSemester.hocKyId
      );

      return {
        semester: currentSemester,
        schedule: schedule,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to fetch current schedule:', error);
      throw error;
    }
  }

  /**
   * Cache helper: Get from cache
   */
  async _getFromCache(key) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > this.config.cacheDuration) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  /**
   * Cache helper: Save to cache
   */
  async _saveToCache(key, data) {
    try {
      await AsyncStorage.setItem(
        key,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const tdmuKeys = keys.filter((key) => key.startsWith('tdmu_'));
      await AsyncStorage.multiRemove(tdmuKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Logout: Clear token and cache
   */
  async logout() {
    try {
      await AsyncStorage.removeItem('tdmu_access_token');
      await this.clearCache();
      delete this.api.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}

export default TDMUScheduleClient;
```

#### 2. React Hook: useTDMUSchedule.js

```javascript
import { useState, useEffect, useCallback } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import TDMUScheduleClient from '../TDMUScheduleClient';

/**
 * Custom hook for TDMU schedule fetching
 * @param {Object} config - Configuration options
 * @returns {Object} Schedule data and control functions
 */
export const useTDMUSchedule = (config = {}) => {
  const [client] = useState(() => new TDMUScheduleClient(config));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [semester, setSemester] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Authenticate with Google and TDMU
   */
  const authenticate = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Google Sign-In
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      if (!tokens.accessToken) {
        throw new Error('Failed to get Google access token');
      }

      // TDMU Authentication
      await client.authenticateWithGoogle(tokens.accessToken);

      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed');
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  /**
   * Fetch current schedule
   */
  const fetchSchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await client.fetchCurrentSchedule();

      setSchedule(result.schedule);
      setSemester(result.semester);

      return result;
    } catch (err) {
      console.error('Schedule fetch error:', err);
      setError(err.message || 'Failed to fetch schedule');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  /**
   * Fetch schedule for specific semester
   */
  const fetchScheduleForSemester = useCallback(
    async (semesterId) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await client.getSchedule(semesterId);
        setSchedule(result);

        return result;
      } catch (err) {
        console.error('Schedule fetch error:', err);
        setError(err.message || 'Failed to fetch schedule');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Get available semesters
   */
  const fetchSemesters = useCallback(async () => {
    try {
      const semesters = await client.getSemesters();
      return semesters;
    } catch (err) {
      console.error('Semesters fetch error:', err);
      setError(err.message || 'Failed to fetch semesters');
      return [];
    }
  }, [client]);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      await client.logout();
      await GoogleSignin.signOut();

      setIsAuthenticated(false);
      setSchedule(null);
      setSemester(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [client]);

  /**
   * Clear cache
   */
  const clearCache = useCallback(async () => {
    await client.clearCache();
  }, [client]);

  return {
    // State
    isAuthenticated,
    isLoading,
    schedule,
    semester,
    error,

    // Actions
    authenticate,
    fetchSchedule,
    fetchScheduleForSemester,
    fetchSemesters,
    logout,
    clearCache,
  };
};

export default useTDMUSchedule;
```

#### 3. Reusable Component: TDMUScheduleView.js

```javascript
import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTDMUSchedule } from '../hooks/useTDMUSchedule';

/**
 * Complete TDMU Schedule component
 * Handles authentication and schedule display
 */
const TDMUScheduleView = ({
  onScheduleFetched,
  config = {},
  renderScheduleItem,
  style,
}) => {
  const {
    isAuthenticated,
    isLoading,
    schedule,
    semester,
    error,
    authenticate,
    fetchSchedule,
    logout,
  } = useTDMUSchedule(config);

  useEffect(() => {
    if (isAuthenticated && !schedule) {
      fetchSchedule();
    }
  }, [isAuthenticated, schedule, fetchSchedule]);

  useEffect(() => {
    if (schedule && onScheduleFetched) {
      onScheduleFetched(schedule, semester);
    }
  }, [schedule, semester, onScheduleFetched]);

  const handleLogin = async () => {
    const success = await authenticate();
    if (success) {
      await fetchSchedule();
    } else {
      Alert.alert('Authentication Failed', 'Please try again');
    }
  };

  const renderScheduleItemDefault = ({ item }) => (
    <View style={styles.scheduleItem}>
      <Text style={styles.courseCode}>{item.maMon || item.courseCode}</Text>
      <Text style={styles.courseName}>{item.tenMon || item.courseName}</Text>
      <Text style={styles.scheduleTime}>
        {item.thu || item.dayOfWeek} - Tiết {item.tiet || item.period}
      </Text>
      <Text style={styles.location}>{item.phong || item.room}</Text>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.title}>TDMU Schedule</Text>
        <Text style={styles.description}>
          Sign in with your Google account to view your schedule
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Sign in with Google</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSchedule}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Schedule</Text>
          {semester && (
            <Text style={styles.semesterText}>
              {semester.tenHocKy || semester.semesterName}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutLink}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={schedule || []}
        renderItem={renderScheduleItem || renderScheduleItemDefault}
        keyExtractor={(item, index) => `${item.id || index}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No schedule data available</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1D',
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  semesterText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutLink: {
    color: '#0066FF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 16,
    padding: 12,
  },
  logoutButtonText: {
    color: '#0066FF',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  scheduleItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseCode: {
    fontSize: 12,
    color: '#0066FF',
    fontWeight: '600',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1D',
    marginBottom: 8,
  },
  scheduleTime: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 32,
  },
});

export default TDMUScheduleView;
```

---

## Package Configuration

### package.json

```json
{
  "name": "tdmu-schedule-fetcher",
  "version": "1.0.0",
  "description": "Reusable package for fetching TDMU university schedules",
  "main": "src/index.js",
  "scripts": {
    "test": "jest",
    "lint": "eslint src/"
  },
  "keywords": ["tdmu", "schedule", "calendar", "react-native", "university"],
  "author": "Your Name",
  "license": "MIT",
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-native": ">=0.60.0"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "@react-native-async-storage/async-storage": "^1.19.0",
    "@react-native-google-signin/google-signin": "^10.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@babel/preset-env": "^7.20.0",
    "eslint": "^8.0.0",
    "jest": "^29.0.0"
  }
}
```

### src/index.js (Main Export)

```javascript
// Main client
export { default as TDMUScheduleClient } from './TDMUScheduleClient';

// Hooks
export { useTDMUSchedule } from './hooks/useTDMUSchedule';

// Components
export { default as TDMUScheduleView } from './components/TDMUScheduleView';

// Default export
import TDMUScheduleClient from './TDMUScheduleClient';
export default TDMUScheduleClient;
```

---

## Usage Examples

### Example 1: Basic Usage with Hook

```javascript
import React from 'react';
import { View, Button, Text, FlatList } from 'react-native';
import { useTDMUSchedule } from 'tdmu-schedule-fetcher';

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
    tdmuUsername: 'user@gw', // Default, can be customized
    cacheEnabled: true,
    cacheDuration: 3600000, // 1 hour
  });

  return (
    <View>
      {!isAuthenticated ? (
        <Button title="Login with Google" onPress={authenticate} />
      ) : (
        <>
          <Button title="Fetch Schedule" onPress={fetchSchedule} />
          <Button title="Logout" onPress={logout} />

          {isLoading && <Text>Loading...</Text>}

          {error && <Text>Error: {error}</Text>}

          {schedule && (
            <FlatList
              data={schedule}
              renderItem={({ item }) => (
                <View>
                  <Text>{item.tenMon}</Text>
                  <Text>
                    {item.thu} - Tiết {item.tiet}
                  </Text>
                </View>
              )}
            />
          )}
        </>
      )}
    </View>
  );
}
```

### Example 2: Using the Complete Component

```javascript
import React from 'react';
import { View } from 'react-native';
import { TDMUScheduleView } from 'tdmu-schedule-fetcher';

function App() {
  const handleScheduleFetched = (schedule, semester) => {
    console.log('Schedule fetched:', schedule);
    console.log('Semester:', semester);
    // Do something with the data
  };

  return (
    <View style={{ flex: 1 }}>
      <TDMUScheduleView
        config={{
          tdmuUsername: 'user@gw',
          cacheEnabled: true,
        }}
        onScheduleFetched={handleScheduleFetched}
      />
    </View>
  );
}
```

### Example 3: Direct Client Usage

```javascript
import TDMUScheduleClient from 'tdmu-schedule-fetcher';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

async function fetchMySchedule() {
  // Initialize client
  const client = new TDMUScheduleClient({
    tdmuUsername: 'user@gw',
    cacheEnabled: true,
  });

  try {
    // Get Google token
    const userInfo = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();

    // Authenticate with TDMU
    await client.authenticateWithGoogle(tokens.accessToken);

    // Fetch current schedule
    const result = await client.fetchCurrentSchedule();

    console.log('Schedule:', result.schedule);
    console.log('Semester:', result.semester);

    return result;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Example 4: Custom Schedule Rendering

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TDMUScheduleView } from 'tdmu-schedule-fetcher';

function CustomScheduleScreen() {
  const renderCustomScheduleItem = ({ item }) => (
    <View style={styles.customCard}>
      <View style={styles.timeTag}>
        <Text style={styles.dayText}>{item.thu}</Text>
      </View>
      <View style={styles.courseInfo}>
        <Text style={styles.courseName}>{item.tenMon}</Text>
        <Text style={styles.details}>
          {item.giangVien} • {item.phong}
        </Text>
        <Text style={styles.period}>Tiết: {item.tiet}</Text>
      </View>
    </View>
  );

  return (
    <TDMUScheduleView
      config={{ cacheEnabled: true }}
      renderScheduleItem={renderCustomScheduleItem}
    />
  );
}

const styles = StyleSheet.create({
  customCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  timeTag: {
    backgroundColor: '#0066FF',
    padding: 12,
    borderRadius: 8,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  details: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 2,
  },
  period: {
    color: '#94A3B8',
    fontSize: 12,
  },
});
```

---

## API Reference

### TDMUScheduleClient

#### Constructor

```javascript
new TDMUScheduleClient(config);
```

**Parameters:**

- `config` (Object, optional)
  - `baseURL` (string): TDMU API base URL. Default: `'https://dkmh.tdmu.edu.vn/api'`
  - `tdmuUsername` (string): TDMU username for authentication. Default: `'user@gw'`
  - `cacheEnabled` (boolean): Enable caching. Default: `true`
  - `cacheDuration` (number): Cache duration in milliseconds. Default: `3600000` (1 hour)

#### Methods

##### authenticateWithGoogle(googleAccessToken)

Authenticate with TDMU using Google access token.

**Parameters:**

- `googleAccessToken` (string): Google OAuth access token

**Returns:** `Promise<Object>` - TDMU authentication response

##### validateAccess()

Validate user's access to TDMU functions.

**Returns:** `Promise<Object>` - Validation response

##### getSemesters()

Get list of available semesters.

**Returns:** `Promise<Array>` - Array of semester objects

##### getSchedule(semesterId, userId?)

Get schedule for a specific semester.

**Parameters:**

- `semesterId` (string|number): Semester ID
- `userId` (string, optional): User ID

**Returns:** `Promise<Object>` - Schedule data

##### fetchCurrentSchedule()

Fetch schedule for the current semester (complete flow).

**Returns:** `Promise<Object>` - Object containing `{ semester, schedule, fetchedAt }`

##### clearCache()

Clear all cached data.

**Returns:** `Promise<void>`

##### logout()

Logout and clear all data.

**Returns:** `Promise<void>`

---

### useTDMUSchedule Hook

```javascript
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
  clearCache,
} = useTDMUSchedule(config);
```

**Parameters:**

- `config` (Object, optional): Same as TDMUScheduleClient config

**Returns:** Object with:

**State:**

- `isAuthenticated` (boolean): Authentication status
- `isLoading` (boolean): Loading state
- `schedule` (Array|null): Schedule data
- `semester` (Object|null): Current semester info
- `error` (string|null): Error message

**Actions:**

- `authenticate()`: Authenticate with Google
- `fetchSchedule()`: Fetch current schedule
- `fetchScheduleForSemester(semesterId)`: Fetch specific semester schedule
- `fetchSemesters()`: Get available semesters
- `logout()`: Logout user
- `clearCache()`: Clear cached data

---

## Setup Guide for Implementers

### Step 1: Install Dependencies

```bash
npm install tdmu-schedule-fetcher

# Or with yarn
yarn add tdmu-schedule-fetcher
```

### Step 2: Configure Google Sign-In

In your app's initialization file:

```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  offlineAccess: true,
});
```

**Get your Web Client ID from:**

1. Firebase Console → Project Settings → General
2. Or Google Cloud Console → APIs & Services → Credentials

### Step 3: Add Required Permissions

#### Android (`android/app/src/main/AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

#### iOS (`ios/YourApp/Info.plist`)

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### Step 4: Implement in Your App

```javascript
import React from 'react';
import { SafeAreaView } from 'react-native';
import { TDMUScheduleView } from 'tdmu-schedule-fetcher';

function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TDMUScheduleView />
    </SafeAreaView>
  );
}

export default App;
```

---

## Key Differences from Current EduEvent Implementation

### What the Package Does Differently:

1. **No Firebase Dependency**: The package fetches directly from TDMU API, not from Firestore
2. **Reusable**: Can be used in any React Native project
3. **Configurable**: All parameters are configurable
4. **Built-in Caching**: Automatic caching of API responses
5. **Complete Abstraction**: All TDMU API complexity is hidden
6. **React Hooks**: Modern React patterns for easy integration

### What Stays the Same:

1. **Authentication Flow**: Google OAuth → TDMU authentication (same as LoginScreen.js)
2. **API Endpoints**: Uses the same TDMU API endpoints
3. **Authentication Parameters**: `username: 'user@gw'`, `password: googleAccessToken`

---

## Important Notes

### Authentication Parameters

The TDMU authentication uses these specific parameters:

- **Username**: `'user@gw'` (fixed value for Google authentication)
- **Password**: Google Access Token (from GoogleSignin.getTokens())
- **Grant Type**: `'password'`

These parameters are configurable in the package but default to the values used in the EduEvent project.

### API Endpoints

The package uses these TDMU API endpoints:

1. `/auth/login` - Authentication
2. `/dkmh/w-checkvalidallchucnang` - Validate access
3. `/sch/w-locdshockytkbuser` - Get semesters
4. `/sch/w-locdstkbtuanusertheohocky` - Get schedule

### Data Format

Schedule data structure (varies by TDMU API response):

```javascript
{
  id: string,
  maMon: string,          // Course code
  tenMon: string,         // Course name
  thu: string,            // Day of week
  tiet: string,           // Period
  phong: string,          // Room
  giangVien: string,      // Instructor
  // ... other fields
}
```

---

## Testing the Package

### Unit Tests

```javascript
// __tests__/TDMUScheduleClient.test.js
import TDMUScheduleClient from '../src/TDMUScheduleClient';

describe('TDMUScheduleClient', () => {
  let client;

  beforeEach(() => {
    client = new TDMUScheduleClient();
  });

  test('should initialize with default config', () => {
    expect(client.config.baseURL).toBe('https://dkmh.tdmu.edu.vn/api');
    expect(client.config.tdmuUsername).toBe('user@gw');
  });

  test('should accept custom config', () => {
    const customClient = new TDMUScheduleClient({
      tdmuUsername: 'custom@gw',
      cacheEnabled: false,
    });
    expect(customClient.config.tdmuUsername).toBe('custom@gw');
    expect(customClient.config.cacheEnabled).toBe(false);
  });
});
```

### Integration Tests

```javascript
// __tests__/integration.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { useTDMUSchedule } from '../src/hooks/useTDMUSchedule';

jest.mock('@react-native-google-signin/google-signin');

describe('useTDMUSchedule Integration', () => {
  test('should authenticate and fetch schedule', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTDMUSchedule());

    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => {
      await result.current.authenticate();
    });

    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

---

## Deployment

### Publishing to NPM

```bash
# Login to npm
npm login

# Build the package
npm run build

# Publish
npm publish
```

### Using as Local Package (Development)

```bash
# In the package directory
npm link

# In your app directory
npm link tdmu-schedule-fetcher
```

---

## Troubleshooting

### Common Issues

#### 1. "Failed to authenticate with TDMU system"

**Solution**: Ensure Google Access Token is valid and not expired

#### 2. "No semesters available"

**Solution**: Check if user has access to TDMU system

#### 3. Cache not working

**Solution**: Verify AsyncStorage permissions and storage availability

#### 4. Google Sign-In fails

**Solution**: Check webClientId configuration and Firebase setup

---

## Conclusion

This package provides a complete, reusable solution for fetching TDMU schedules. It abstracts all the complexity of:

- Google OAuth authentication
- TDMU API authentication
- Schedule fetching
- Caching
- Error handling

**Key Benefits:**

- ✅ No Firebase dependency for schedule fetching
- ✅ Fully reusable across projects
- ✅ Modern React patterns (Hooks)
- ✅ Built-in caching
- ✅ Comprehensive error handling
- ✅ Customizable components
- ✅ Type-safe (can be extended with TypeScript)

**Next Steps:**

1. Implement the package structure
2. Add TypeScript types
3. Write comprehensive tests
4. Create example project
5. Publish to npm

---

## Appendix: Complete File Tree

```
tdmu-schedule-fetcher/
├── src/
│   ├── index.js
│   ├── TDMUScheduleClient.js
│   ├── hooks/
│   │   └── useTDMUSchedule.js
│   ├── components/
│   │   └── TDMUScheduleView.js
│   └── utils/
│       ├── cache.js
│       └── formatters.js
├── example/
│   ├── App.js
│   ├── BasicExample.js
│   ├── HookExample.js
│   └── CustomRenderExample.js
├── __tests__/
│   ├── TDMUScheduleClient.test.js
│   ├── useTDMUSchedule.test.js
│   └── integration.test.js
├── .gitignore
├── .npmignore
├── package.json
├── README.md
├── LICENSE
└── CHANGELOG.md
```

---

**Document Version**: 1.0.0  
**Last Updated**: November 5, 2025  
**Author**: EduEvent Development Team
