import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthProvider';
import type { ProfileImage } from '@/types/auth';

const DEFAULT_USERNAME = '푱푱한 토끼';

export default function ProfileSettingScreen() {
  const router = useRouter();
  const { user, updateUsername, setProfileImg, updateUsernameMutation, uploadProfileImageMutation } = useAuth();
  const [username, setUsername] = useState('');
  const [image, setImage] = useState<ProfileImage | null>(null);
  const isSubmitting = updateUsernameMutation.isPending || uploadProfileImageMutation.isPending;

  useEffect(() => {
    if (user?.username) setUsername(user.username);
  }, [user?.username]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('사진 접근 권한 필요', '프로필 사진을 선택하려면 사진 보관함 접근을 허용해주세요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setImage({
      uri: asset.uri,
      name: asset.fileName ?? 'profile-image.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    });
  };

  const submit = async () => {
    if (isSubmitting) return;
    try {
      await updateUsername(username.trim() || DEFAULT_USERNAME);
      if (image) await setProfileImg(image);
      router.replace('/onboarding/interests');
    } catch {
      Alert.alert('저장 실패', '프로필을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>프로필 설정</Text>
            <Text style={styles.subtitle}>프로필 사진과 이름을 설정해주세요</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="프로필 사진 선택" onPress={pickImage} style={styles.avatar}>
            {image ? <Image source={{ uri: image.uri }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>사진 선택</Text>}
          </Pressable>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder={DEFAULT_USERNAME}
            placeholderTextColor="#8A8A8A"
            textContentType="nickname"
            returnKeyType="done"
            onSubmitEditing={submit}
            editable={!isSubmitting}
          />
          <Pressable onPress={submit} disabled={isSubmitting} style={[styles.button, isSubmitting && styles.disabled]}>
            <Text style={styles.buttonText}>{isSubmitting ? '저장 중...' : '완료'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' }, container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 30, fontWeight: '800', color: '#161616' },
  subtitle: { marginTop: 12, fontSize: 16, color: '#555', textAlign: 'center' },
  avatar: { width: 132, height: 132, borderRadius: 66, alignSelf: 'center', backgroundColor: '#E6F4FE', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 28 },
  avatarImage: { width: '100%', height: '100%' }, avatarText: { color: '#208AEF', fontWeight: '700' },
  input: { height: 56, borderWidth: 1, borderColor: '#D8D8D8', borderRadius: 12, paddingHorizontal: 16, fontSize: 17, color: '#161616' },
  button: { height: 56, marginTop: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#208AEF' },
  disabled: { opacity: 0.6 }, buttonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
