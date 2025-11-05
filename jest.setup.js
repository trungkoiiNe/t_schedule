/* eslint-env jest */
/* global jest */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Expo AuthSession
jest.mock('expo-auth-session', () => ({
  AuthSession: {
    makeRedirectUri: jest.fn(
      () => 'https://auth.expo.io/@mock/tschedule-example'
    ),
    startAsync: jest.fn(() =>
      Promise.resolve({
        type: 'success',
        params: {
          id_token: 'mock-google-id-token',
          access_token: 'mock-google-access-token',
        },
      })
    ),
  },
}));

// Mock Expo WebBrowser
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: 'closed' })),
}));

// Mock Expo Crypto
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(() => Promise.resolve(new Uint8Array(32))),
  digestStringAsync: jest.fn(() => Promise.resolve('mock-digest')),
}));

// Mock expo-auth-session providers
jest.mock('expo-auth-session/providers/google', () => ({
  useIdTokenAuthRequest: jest.fn(() => [
    null, // request
    null, // response
    jest.fn(() =>
      Promise.resolve({
        type: 'success',
        params: { id_token: 'mock-google-id-token' },
      })
    ), // promptAsync
  ]),
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
  get: jest.fn(),
  post: jest.fn(),
}));
