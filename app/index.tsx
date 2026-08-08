import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/AuthProvider';
import HomeScreen from '@/screens/HomeScreen';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#208AEF" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/calendar" />;
  }

  return <HomeScreen />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
