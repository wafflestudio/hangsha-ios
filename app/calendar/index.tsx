import { useRouter } from 'expo-router';

import { CalendarScreen } from '@/screens/CalendarScreen';

export default function CalendarIndexScreen() {
  const router = useRouter();

  return (
    <CalendarScreen
      onSearch={() => router.push('/search')}
      onSelectDate={(dateKey) =>
        router.push({ pathname: '/calendar/[date]', params: { date: dateKey } })
      }
    />
  );
}
