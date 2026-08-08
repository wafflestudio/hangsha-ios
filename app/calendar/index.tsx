import { useRouter } from 'expo-router';

import { CalendarScreen } from '@/screens/CalendarScreen';

export default function CalendarIndexScreen() {
  const router = useRouter();

  return (
    <CalendarScreen
      onSelectDate={(dateKey) =>
        router.push({ pathname: '/calendar/[date]', params: { date: dateKey } })
      }
    />
  );
}
