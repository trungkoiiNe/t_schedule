import { useState, useCallback } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import TDMUScheduleClient from '../TDMUScheduleClient';
import type {
  TDMUConfig,
  ScheduleItem,
  Semester,
  ScheduleResult,
} from '../TDMUScheduleClient';

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

  /**
   * Authenticate with Google and TDMU
   */
  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Google Sign-In
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      if (!tokens.accessToken) {
        throw new Error('Failed to get Google access token');
      }

      // TDMU Authentication
      await client.authenticateWithGoogle(tokens.accessToken);

      setIsAuthenticated(true);
      return true;
    } catch (err: any) {
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
