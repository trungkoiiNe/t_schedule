/**
 * Hook Example: Using the useTDMUSchedule hook
 * This provides more control and customization options
 */
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTDMUSchedule } from 'react-native-t-schedule';
import type { ScheduleItem } from 'react-native-t-schedule';

export default function HookExample() {
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
    tdmuUsername: 'user@gw',
    cacheEnabled: true,
    cacheDuration: 3600000, // 1 hour
  });

  const renderScheduleItem = ({ item }: { item: ScheduleItem }) => (
    <View style={styles.scheduleItem}>
      <Text style={styles.courseCode}>{item.maMon || item.courseCode}</Text>
      <Text style={styles.courseName}>{item.tenMon || item.courseName}</Text>
      <Text style={styles.details}>
        {item.thu || item.dayOfWeek} - Tiết {item.tiet || item.period}
      </Text>
      <Text style={styles.room}>{item.phong || item.room}</Text>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>TDMU Schedule Hook Example</Text>
        <Text style={styles.subtitle}>Sign in to view your schedule</Text>
        <Button title="Login with Google" onPress={authenticate} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Try Again" onPress={fetchSchedule} />
        <Button title="Logout" onPress={logout} />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Schedule</Text>
          {semester && (
            <Text style={styles.semesterText}>
              {semester.tenHocKy || semester.semesterName}
            </Text>
          )}
        </View>
        <Button title="Logout" onPress={logout} />
      </View>

      <FlatList
        data={schedule || []}
        renderItem={renderScheduleItem}
        keyExtractor={(item, index) => `${item.id || index}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No schedule data available</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20,
  },
  semesterText: {
    fontSize: 14,
    color: '#64748B',
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
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  room: {
    fontSize: 14,
    color: '#94A3B8',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
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
