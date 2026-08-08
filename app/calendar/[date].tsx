import { useLocalSearchParams } from 'expo-router';

import { DailyEventsScreen } from '@/screens/DailyEventsScreen';

export default function DailyEventsRoute() {
  const { date } = useLocalSearchParams<{ date: string }>();

  return <DailyEventsScreen date={date} />;
}
