import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [image, setImage] = useState<ProfileImage | null>(null);
  const isUploadingImage = uploadProfileImageMutation.isPending;
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>프로필 설정</Text>
            <Text style={styles.subtitle}>프로필 사진과 이름을 설정해주세요</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="프로필 사진 선택"
            accessibilityState={{ disabled: isSubmitting, busy: isUploadingImage }}
            onPress={pickImage}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.avatar, pressed && !isSubmitting && styles.pressed]}>
            <Image
              source={image ? { uri: image.uri } : require('@/assets/images/defaultProfile.png')}
              style={styles.avatarImage}
              resizeMode="cover"
            />
            {isUploadingImage && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.uploadLabel}>사진 업로드 중</Text>
              </View>
            )}
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
          <Pressable
            onPress={submit}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
            style={({ pressed }) => [
              styles.button,
              pressed && !isSubmitting && styles.pressed,
              isSubmitting && styles.disabled,
            ]}>
            {isSubmitting && <ActivityIndicator size="small" color="#FFFFFF" />}
            <Text style={styles.buttonText}>
              {isUploadingImage
                ? '사진 업로드 중...'
                : updateUsernameMutation.isPending
                  ? '닉네임 저장 중...'
                  : '닉네임 설정하기'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    paddingHorizontal: 50,
    paddingTop: 170,
  },
  header: { alignItems: 'center', marginBottom: 66 },
  title: {
    color: '#111111',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 6,
    color: '#222222',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  avatar: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 19,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: '#D9D9D9',
  },
  avatarImage: { width: '100%', height: '100%' },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  uploadLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  input: {
    width: '100%',
    height: 42,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    color: '#161616',
    fontSize: 16,
    textAlign: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
    elevation: 2,
  },
  button: {
    width: '100%',
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 19,
    borderRadius: 999,
    backgroundColor: '#111111',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
    elevation: 2,
  },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.65 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
