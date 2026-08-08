import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function DailyEventsScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();

  return (
    <ThemedView>
      <ThemedText>{date}</ThemedText>
    </ThemedView>
  );
}
