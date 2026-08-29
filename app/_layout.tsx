import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { Appearance } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/contexts/AuthProvider';
import { BugReportProvider } from '@/contexts/BugReportContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { useThemePreference } from '@/contexts/ThemeContext';
import { UserDataProvider } from '@/contexts/UserDataContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryClient } from '@/lib/queryClient';
import { Colors } from '@/util/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const preference = useThemePreference((state) => state.preference);
  const colors = Colors[colorScheme];
  const navigationTheme = useMemo(() => {
    const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.danger,
      },
    };
  }, [colorScheme, colors]);

  useEffect(() => {
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }, [preference]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserDataProvider>
            <OnboardingProvider>
              <BugReportProvider>
                <ThemeProvider value={navigationTheme}>
                  <BottomSheetModalProvider>
                    <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} animated />
                    <AnimatedSplashOverlay />
                    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen name="login" />
                      <Stack.Screen name="signup" />
                      <Stack.Screen name="onboarding/profile" />
                      <Stack.Screen name="onboarding/interests" />
                      <Stack.Screen name="onboarding/complete" />
                      <Stack.Screen name="calendar" />
                      <Stack.Screen name="search" />
                      <Stack.Screen name="timetable" />
                      <Stack.Screen name="memos" />
                      <Stack.Screen name="bookmark" />
                      <Stack.Screen name="mypage" />
                    </Stack>
                  </BottomSheetModalProvider>
                </ThemeProvider>
              </BugReportProvider>
            </OnboardingProvider>
          </UserDataProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
