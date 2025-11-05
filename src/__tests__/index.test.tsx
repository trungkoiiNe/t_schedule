import TDMUScheduleClient, {
  TDMUScheduleView,
  useTDMUSchedule,
} from '../index';

describe('react-native-t-schedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Exports', () => {
    it('should export TDMUScheduleClient', () => {
      expect(TDMUScheduleClient).toBeDefined();
      expect(typeof TDMUScheduleClient).toBe('function');
    });

    it('should export TDMUScheduleView component', () => {
      expect(TDMUScheduleView).toBeDefined();
      expect(typeof TDMUScheduleView).toBe('function');
    });

    it('should export useTDMUSchedule hook', () => {
      expect(useTDMUSchedule).toBeDefined();
      expect(typeof useTDMUSchedule).toBe('function');
    });
  });

  describe('TDMUScheduleClient', () => {
    it('should create instance with default config', () => {
      const client = new TDMUScheduleClient();
      expect(client).toBeInstanceOf(TDMUScheduleClient);
    });

    it('should create instance with custom config', () => {
      const client = new TDMUScheduleClient({
        tdmuUsername: 'custom@gw',
        cacheEnabled: false,
        cacheDuration: 1800000,
      });
      expect(client).toBeInstanceOf(TDMUScheduleClient);
    });

    it('should have authenticateWithGoogle method', () => {
      const client = new TDMUScheduleClient();
      expect(typeof client.authenticateWithGoogle).toBe('function');
    });

    it('should have getSemesters method', () => {
      const client = new TDMUScheduleClient();
      expect(typeof client.getSemesters).toBe('function');
    });

    it('should have getSchedule method', () => {
      const client = new TDMUScheduleClient();
      expect(typeof client.getSchedule).toBe('function');
    });

    it('should have fetchCurrentSchedule method', () => {
      const client = new TDMUScheduleClient();
      expect(typeof client.fetchCurrentSchedule).toBe('function');
    });

    it('should have logout method', () => {
      const client = new TDMUScheduleClient();
      expect(typeof client.logout).toBe('function');
    });

    it('should have clearCache method', () => {
      const client = new TDMUScheduleClient();
      expect(typeof client.clearCache).toBe('function');
    });
  });
});
