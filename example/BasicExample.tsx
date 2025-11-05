/**
 * Basic Example: Using the TDMUScheduleView component
 * This is the simplest way to integrate TDMU schedule fetching
 */
import { SafeAreaView, StyleSheet } from 'react-native';
import { TDMUScheduleView } from 'react-native-t-schedule';

export default function BasicExample() {
  return (
    <SafeAreaView style={styles.container}>
      <TDMUScheduleView />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
