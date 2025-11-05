// Main client
export { default as TDMUScheduleClient } from './TDMUScheduleClient';
export type {
  TDMUConfig,
  TDMUAuthResponse,
  Semester,
  ScheduleItem,
  ScheduleResult,
} from './TDMUScheduleClient';

// Hooks
export { useTDMUSchedule } from './hooks/useTDMUSchedule';
export type { UseTDMUScheduleReturn } from './hooks/useTDMUSchedule';

// Components
export { default as TDMUScheduleView } from './components/TDMUScheduleView';
export type { TDMUScheduleViewProps } from './components/TDMUScheduleView';

// Default export
import TDMUScheduleClient from './TDMUScheduleClient';
export default TDMUScheduleClient;
