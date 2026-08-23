import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/AuthProvider';
import HomeScreen from '@/screens/HomeScreen';
import { AdaptiveColors } from '@/util/theme';

export default function IndexScreen() {
  const { isAuthenticated, isLoading, onboardingStep } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={AdaptiveColors.accent} />
      </View>
    );
  }

  if (isAuthenticated) {
    if (onboardingStep === 'profile') {
      return <Redirect href="/onboarding/profile" />;
    }
    if (onboardingStep === 'interests') {
      return <Redirect href="/onboarding/interests" />;
    }
    return <Redirect href="/calendar" />;
  }

  return <HomeScreen />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AdaptiveColors.background,
  },
});
