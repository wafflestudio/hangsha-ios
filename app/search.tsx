import { useLocalSearchParams } from 'expo-router';

import { SearchScreen } from '@/screens/SearchScreen';

export default function SearchRoute() {
  const { q } = useLocalSearchParams<{ q?: string }>();

  return <SearchScreen initialQuery={q} />;
}
