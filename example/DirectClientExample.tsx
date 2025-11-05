/**
 * Direct Client Example: Using TDMUScheduleClient directly
 * This provides the most control but requires more manual handling
 */
import { useState } from 'react';
import {
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { TDMUScheduleClient } from 'react-native-t-schedule';
import type { ScheduleItem, Semester } from 'react-native-t-schedule';

export default function DirectClientExample() {
  const [client] = useState(
    () =>
      new TDMUScheduleClient({
        tdmuUsername: 'user@gw',
        cacheEnabled: true,
        cacheDuration: 3600000,
      })
  );

  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
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

      console.log('✅ Authentication successful!');

      // Fetch schedule
      await handleFetchSchedule();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchSchedule = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await client.fetchCurrentSchedule();

      setSchedule(result.schedule);
      setSemester(result.semester);

      console.log('✅ Schedule fetched!');
      console.log(
        `📅 Semester: ${result.semester.tenHocKy || result.semester.semesterName}`
      );
      console.log(`📚 Total items: ${result.schedule.length}`);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await client.logout();
      await GoogleSignin.signOut();
      setSchedule([]);
      setSemester(null);
      console.log('✅ Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleClearCache = async () => {
    try {
      await client.clearCache();
      console.log('✅ Cache cleared');
    } catch (err) {
      console.error('Clear cache error:', err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Processing...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <Button title="Try Again" onPress={handleLogin} />
      </View>
    );
  }

  if (schedule.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Direct Client Example</Text>
        <Text style={styles.subtitle}>
          This example uses TDMUScheduleClient directly
        </Text>
        <Button title="Login & Fetch Schedule" onPress={handleLogin} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Schedule (Direct Client)</Text>
          {semester && (
            <Text style={styles.semesterText}>
              {semester.tenHocKy || semester.semesterName}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Refresh" onPress={handleFetchSchedule} />
        <Button title="Clear Cache" onPress={handleClearCache} />
        <Button title="Logout" onPress={handleLogout} color="#DC2626" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {schedule.map((item, index) => (
          <View key={index} style={styles.scheduleItem}>
            <Text style={styles.courseCode}>
              {item.maMon || item.courseCode}
            </Text>
            <Text style={styles.courseName}>
              {item.tenMon || item.courseName}
            </Text>
            <Text style={styles.details}>
              {item.thu || item.dayOfWeek} - Tiết {item.tiet || item.period}
            </Text>
            <Text style={styles.room}>📍 {item.phong || item.room}</Text>
          </View>
        ))}
      </ScrollView>
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
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  semesterText: {
    fontSize: 14,
    color: '#64748B',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  scrollContainer: {
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
    color: '#64748B',
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
});
