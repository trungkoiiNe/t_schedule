import { useState, useCallback, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
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

  // Set up Google auth request
  const [request, response, promptAsync] = useIdTokenAuthRequest(
    {
      webClientId: googleClientId || '', // Use webClientId for Google OAuth
      responseType: AuthSession.ResponseType.IdToken,
      scopes: ['openid', 'email', 'profile'],
    }
    // Don't specify scheme here - let AuthSession.makeRedirectUri() handle it automatically
  );

  const handleGoogleAuthSuccess = useCallback(
    async (idToken: string) => {
      try {
        console.log('Got Google ID token');

        // Authenticate with TDMU using Google ID token
        await client.authenticateWithGoogle(idToken);
        console.log('TDMU authentication successful');

        setIsAuthenticated(true);
        setError(null);
        setIsLoading(false);
      } catch (err: any) {
        console.error('TDMU authentication error:', err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          'TDMU authentication failed';
        setError(errorMessage);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    },
    [client]
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { params } = response;
      const idToken = params.id_token;

      if (idToken) {
        handleGoogleAuthSuccess(idToken);
      } else {
        setError('No ID token received from Google');
        setIsLoading(false);
      }
    } else if (response?.type === 'error') {
      console.error('Google OAuth error:', response.error);
      setError(response.error?.description || 'Google authentication failed');
      setIsLoading(false);
    } else if (response?.type === 'cancel') {
      console.log('User cancelled authentication');
      setError('Authentication cancelled');
      setIsLoading(false);
    }
  }, [response, handleGoogleAuthSuccess]);

  /**
   * Authenticate with Google and TDMU using Expo AuthSession
   */
  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Wait for Google Client ID if not loaded yet
      if (!googleClientId) {
        console.log('Waiting for Google Client ID...');
        // Give it a short retry window
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!googleClientId) {
          throw new Error(
            'Could not load Google Client ID from TDMU. Please check your internet connection and try again.'
          );
        }
      }

      if (!request) {
        throw new Error(
          'OAuth request not ready. Please try again in a moment.'
        );
      }

      console.log(
        'Starting Google OAuth flow with Client ID:',
        googleClientId.substring(0, 20) + '...'
      );
      const result = await promptAsync();

      // The actual authentication result will be handled in useEffect
      return result.type !== 'error' && result.type !== 'dismiss';
    } catch (err: any) {
      console.error('Authentication error:', err);
      const errorMessage =
        err.message || 'Authentication failed. Please try again.';
      setError(errorMessage);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  }, [googleClientId, request, promptAsync]);

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
