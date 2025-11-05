import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  type ViewStyle,
  type ListRenderItem,
} from 'react-native';
import { useTDMUSchedule } from '../hooks/useTDMUSchedule';
import type { TDMUConfig, ScheduleItem, Semester } from '../TDMUScheduleClient';

export interface TDMUScheduleViewProps {
  onScheduleFetched?: (
    schedule: ScheduleItem[],
    semester: Semester | null
  ) => void;
  config?: TDMUConfig;
  renderScheduleItem?: ListRenderItem<ScheduleItem>;
  style?: ViewStyle;
}

/**
 * Complete TDMU Schedule component
 * Handles authentication and schedule display
 */
const TDMUScheduleView: React.FC<TDMUScheduleViewProps> = ({
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

  const renderScheduleItemDefault: ListRenderItem<ScheduleItem> = ({
    item,
  }) => (
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
