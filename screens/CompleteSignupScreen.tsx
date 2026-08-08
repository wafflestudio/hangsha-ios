import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompleteSignupScreen() {
  const router = useRouter();
  return <SafeAreaView style={styles.safeArea}><View style={styles.container}><Text style={styles.sparkles}>✦  ·  ✧  ·  ✦</Text><Text style={styles.title}>환영합니다!</Text><Text style={styles.subtitle}>나에게 맞는 행사를 찾아드릴게요.</Text><Pressable onPress={() => router.replace('/calendar')} style={styles.button}><Text style={styles.buttonText}>캘린더로 가기</Text></Pressable></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#208AEF' }, container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }, sparkles: { color: '#D9F1FF', fontSize: 36, marginBottom: 36 }, title: { color: '#fff', fontSize: 36, fontWeight: '800' }, subtitle: { marginTop: 14, color: '#E6F4FE', fontSize: 17 }, button: { marginTop: 48, backgroundColor: '#fff', borderRadius: 28, paddingHorizontal: 28, paddingVertical: 16 }, buttonText: { color: '#208AEF', fontSize: 17, fontWeight: '800' } });
