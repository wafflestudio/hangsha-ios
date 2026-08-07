import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/contexts/AuthProvider';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { UserDataProvider } from '@/contexts/UserDataContext';
import { queryClient } from '@/lib/queryClient';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserDataProvider>
          <OnboardingProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AnimatedSplashOverlay />
              <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="onboarding/profile" />
                <Stack.Screen name="onboarding/interests" />
                <Stack.Screen name="onboarding/complete" />
                <Stack.Screen name="calendar" />
                <Stack.Screen name="explore" />
              </Stack>
            </ThemeProvider>
          </OnboardingProvider>
        </UserDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
