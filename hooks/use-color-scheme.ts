import { useColorScheme as useRNColorScheme } from 'react-native';

import { useThemePreference } from '@/contexts/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme();
  const preference = useThemePreference((state) => state.preference);

  if (preference !== 'system') return preference;
  return systemScheme === 'dark' ? 'dark' : 'light';
}
