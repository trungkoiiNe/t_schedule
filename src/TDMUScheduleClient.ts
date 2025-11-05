import axios, { type AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TDMUConfig {
  baseURL?: string;
  tdmuUsername?: string;
  cacheEnabled?: boolean;
  cacheDuration?: number;
}

export interface TDMUAuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface Semester {
  id?: string;
  hocKyId?: string;
  tenHocKy?: string;
  semesterName?: string;
}

export interface ScheduleItem {
  id?: string;
  maMon?: string;
  courseCode?: string;
  tenMon?: string;
  courseName?: string;
  thu?: string;
  dayOfWeek?: string;
  tiet?: string;
  period?: string;
  phong?: string;
  room?: string;
  giangVien?: string;
  instructor?: string;
}

export interface ScheduleResult {
  semester: Semester;
  schedule: ScheduleItem[];
  fetchedAt: string;
}

interface CacheData<T> {
  data: T;
  timestamp: number;
}

class TDMUScheduleClient {
  private config: Required<TDMUConfig>;
  private api: AxiosInstance;

  constructor(config: TDMUConfig = {}) {
    this.config = {
      baseURL: config.baseURL || 'https://dkmh.tdmu.edu.vn/public/api',
      tdmuUsername: config.tdmuUsername || 'user@gw',
      cacheEnabled: config.cacheEnabled !== false,
      cacheDuration: config.cacheDuration || 3600000, // 1 hour
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

  private _setupInterceptors(): void {
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
   * Authenticate with TDMU using Google ID Token
   * @param googleIdToken - Google OAuth ID token
   * @returns TDMU authentication data
   */
  async authenticateWithGoogle(
    googleIdToken: string
  ): Promise<TDMUAuthResponse> {
    try {
      const formData = new URLSearchParams();
      formData.append('username', this.config.tdmuUsername);
      formData.append('password', googleIdToken);
      formData.append('grant_type', 'password');

      const response = await axios.post<TDMUAuthResponse>(
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
      this.api.defaults.headers.common.Authorization = `${token_type} ${access_token}`;

      return response.data;
    } catch (error) {
      console.error('TDMU Authentication Failed:', error);
      throw new Error('Failed to authenticate with TDMU system');
    }
  }

  /**
   * Get TDMU authentication configuration
   * @returns Auth configuration including Google client ID
   */
  async getAuthConfig(): Promise<{
    gg: string;
    logoff: boolean;
    timeout: number;
  }> {
    try {
      const response = await axios.get(
        `${this.config.baseURL.replace('/public/api', '')}/authconfig`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch TDMU auth config:', error);
      throw error;
    }
  }

  /**
   * Validate user's access to TDMU functions
   * @returns Validation response
   */
  async validateAccess(): Promise<any> {
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
   * @returns List of semesters
   */
  async getSemesters(): Promise<Semester[]> {
    try {
      const cacheKey = 'tdmu_semesters';

      // Check cache
      if (this.config.cacheEnabled) {
        const cached = await this._getFromCache<Semester[]>(cacheKey);
        if (cached) return cached;
      }

      const response = await this.api.get<Semester[]>(
        '/sch/w-locdshockytkbuser'
      );

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
   * @param semesterId - Semester ID
   * @param userId - Optional user ID
   * @returns Schedule data
   */
  async getSchedule(
    semesterId: string | number,
    userId?: string
  ): Promise<ScheduleItem[]> {
    try {
      const params: any = { hocky: semesterId };
      if (userId) params.user = userId;

      const cacheKey = `tdmu_schedule_${semesterId}_${userId || 'current'}`;

      // Check cache
      if (this.config.cacheEnabled) {
        const cached = await this._getFromCache<ScheduleItem[]>(cacheKey);
        if (cached) return cached;
      }

      const response = await this.api.get<ScheduleItem[]>(
        '/sch/w-locdstkbtuanusertheohocky',
        { params }
      );

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
   * @returns Schedule and semester info
   */
  async fetchCurrentSchedule(): Promise<ScheduleResult> {
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

      if (!currentSemester) {
        throw new Error('No current semester found');
      }

      // Fetch schedule
      const schedule = await this.getSchedule(
        currentSemester.id || currentSemester.hocKyId || ''
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
  private async _getFromCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp }: CacheData<T> = JSON.parse(cached);
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
  private async _saveToCache<T>(key: string, data: T): Promise<void> {
    try {
      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
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
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('tdmu_access_token');
      await this.clearCache();
      delete this.api.defaults.headers.common.Authorization;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}

export default TDMUScheduleClient;
