/**
 * Custom Render Example: Using custom rendering with TDMUScheduleView
 * This shows how to customize the schedule item display
 */
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { TDMUScheduleView } from 'react-native-t-schedule';
import type { ScheduleItem, Semester } from 'react-native-t-schedule';

export default function CustomRenderExample() {
  const handleScheduleFetched = (
    schedule: ScheduleItem[],
    semester: Semester | null
  ) => {
    console.log('✅ Schedule fetched!');
    console.log(`📅 Semester: ${semester?.tenHocKy || semester?.semesterName}`);
    console.log(`📚 Total courses: ${schedule.length}`);
  };

  const renderCustomScheduleItem = ({ item }: { item: ScheduleItem }) => {
    const dayOfWeek = item.thu || item.dayOfWeek || 'N/A';
    const period = item.tiet || item.period || 'N/A';
    const courseCode = item.maMon || item.courseCode || 'N/A';
    const courseName = item.tenMon || item.courseName || 'Unknown Course';
    const room = item.phong || item.room || 'TBA';
    const instructor = item.giangVien || item.instructor || 'TBA';

    return (
      <View style={styles.customCard}>
        <View style={styles.timeSection}>
          <View style={styles.dayBadge}>
            <Text style={styles.dayText}>{dayOfWeek}</Text>
          </View>
          <View style={styles.periodBadge}>
            <Text style={styles.periodText}>Tiết {period}</Text>
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.courseHeader}>
            <Text style={styles.courseCode}>{courseCode}</Text>
            <Text style={styles.roomBadge}>{room}</Text>
          </View>
          <Text style={styles.courseName}>{courseName}</Text>
          <Text style={styles.instructor}>👨‍🏫 {instructor}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TDMUScheduleView
        config={{
          tdmuUsername: 'user@gw',
          cacheEnabled: true,
        }}
        renderScheduleItem={renderCustomScheduleItem}
        onScheduleFetched={handleScheduleFetched}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  timeSection: {
    marginRight: 16,
    alignItems: 'center',
  },
  dayBadge: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  dayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  periodBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  contentSection: {
    flex: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  courseCode: {
    fontSize: 12,
    color: '#0066FF',
    fontWeight: 'bold',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roomBadge: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
    lineHeight: 22,
  },
  instructor: {
    fontSize: 13,
    color: '#64748B',
  },
});
