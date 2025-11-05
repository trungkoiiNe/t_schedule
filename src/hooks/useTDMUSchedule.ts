import { useState, useCallback, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import TDMUScheduleClient from '../TDMUScheduleClient';
import type {
  TDMUConfig,
  ScheduleItem,
  Semester,
  ScheduleResult,
} from '../TDMUScheduleClient';

WebBrowser.maybeCompleteAuthSession();

export interface UseTDMUScheduleReturn {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  schedule: ScheduleItem[] | null;
  semester: Semester | null;
  error: string | null;

  // Actions
  authenticate: () => Promise<boolean>;
  fetchSchedule: () => Promise<ScheduleResult | null>;
  fetchScheduleForSemester: (
    semesterId: string | number
  ) => Promise<ScheduleItem[] | null>;
  fetchSemesters: () => Promise<Semester[]>;
  logout: () => Promise<void>;
  clearCache: () => Promise<void>;
}

/**
 * Custom hook for TDMU schedule fetching
 * @param config - Configuration options
 * @returns Schedule data and control functions
 */
export const useTDMUSchedule = (
  config: TDMUConfig = {}
): UseTDMUScheduleReturn => {
  const [client] = useState(() => new TDMUScheduleClient(config));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[] | null>(null);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);

  // Fetch Google client ID from TDMU config
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const { data } = await axios.get(
          'https://dkmh.tdmu.edu.vn/public/api/auth/authconfig'
        );
        const clientId = data.gg;
        if (clientId) {
          setGoogleClientId(clientId);
        }
      } catch (err) {
        console.error('Failed to fetch TDMU auth config:', err);
      }
    };
    fetchClientId();
  }, []);

  /**
   * Authenticate with Google and TDMU using Expo AuthSession (manual flow)
   * No androidClientId required - works with web client ID only!
   */
  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Wait for Google Client ID if not loaded yet
      if (!googleClientId) {
        console.log('Waiting for Google Client ID...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!googleClientId) {
          throw new Error(
            'Could not load Google Client ID from TDMU. Please check your internet connection and try again.'
          );
        }
      }

      console.log(
        'Starting Google OAuth flow with Client ID:',
        googleClientId.substring(0, 20) + '...'
      );

      // Manual OAuth flow - no androidClientId needed!
      const redirectUri = AuthSession.makeRedirectUri();
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(googleClientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=id_token` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&nonce=${Math.random().toString(36).substring(2)}`;

      console.log('Redirect URI:', redirectUri);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      if (result.type === 'success') {
        // Parse the URL to extract id_token from hash
        const url = result.url;
        const hashParams = new URLSearchParams(url.split('#')[1] || '');
        const idToken = hashParams.get('id_token');

        if (!idToken) {
          throw new Error('No ID token received from Google');
        }

        console.log('Got Google ID token');

        // Authenticate with TDMU using Google ID token
        await client.authenticateWithGoogle(idToken);
        console.log('TDMU authentication successful');

        setIsAuthenticated(true);
        setError(null);
        setIsLoading(false);
        return true;
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('User cancelled authentication');
        setError('Authentication cancelled');
        setIsLoading(false);
        return false;
      }

      return false;
    } catch (err: any) {
      console.error('Authentication error:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please try again.';
      setError(errorMessage);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  }, [googleClientId, client]);

  /**
   * Fetch current schedule
   */
  const fetchSchedule =
    useCallback(async (): Promise<ScheduleResult | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await client.fetchCurrentSchedule();

        setSchedule(result.schedule);
        setSemester(result.semester);

        return result;
      } catch (err: any) {
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
    async (semesterId: string | number): Promise<ScheduleItem[] | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await client.getSchedule(semesterId);
        setSchedule(result);

        return result;
      } catch (err: any) {
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
  const fetchSemesters = useCallback(async (): Promise<Semester[]> => {
    try {
      const semesters = await client.getSemesters();
      return semesters;
    } catch (err: any) {
      console.error('Semesters fetch error:', err);
      setError(err.message || 'Failed to fetch semesters');
      return [];
    }
  }, [client]);

  /**
   * Logout
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await client.logout();

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
  const clearCache = useCallback(async (): Promise<void> => {
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
