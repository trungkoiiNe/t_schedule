import { SafeAreaView, StyleSheet } from 'react-native';
import { TDMUScheduleView } from 'react-native-t-schedule';
import type { ScheduleItem, Semester } from 'react-native-t-schedule';

export default function App() {
  const handleScheduleFetched = (
    schedule: ScheduleItem[],
    semester: Semester | null
  ) => {
    console.log('Schedule fetched successfully!');
    console.log('Semester:', semester?.tenHocKy || semester?.semesterName);
    console.log('Number of items:', schedule.length);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TDMUScheduleView
        config={{
          tdmuUsername: 'user@gw',
          cacheEnabled: true,
          cacheDuration: 3600000, // 1 hour
        }}
        onScheduleFetched={handleScheduleFetched}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
