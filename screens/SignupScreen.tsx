// screens/SignupScreen.tsx

import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthProvider";

export default function SignupScreen() {
  const router = useRouter();
  const { signup, signupMutation } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const isSubmitting = signupMutation.isPending;

  const validateForm = () => {
    if (!username.trim()) {
      Alert.alert("알림", "사용자 이름을 입력해주세요.");
      return false;
    }

    if (!email.trim()) {
      Alert.alert("알림", "이메일을 입력해주세요.");
      return false;
    }

    // 필요하면 학교 이메일만 허용
    // if (!email.trim().endsWith("@snu.ac.kr")) {
    //   Alert.alert("알림", "서울대학교 이메일을 입력해주세요.");
    //   return false;
    // }

    if (!password.trim()) {
      Alert.alert("알림", "비밀번호를 입력해주세요.");
      return false;
    }

    if (!passwordConfirm.trim()) {
      Alert.alert("알림", "비밀번호 확인을 입력해주세요.");
      return false;
    }

    if (password !== passwordConfirm) {
      Alert.alert("알림", "비밀번호가 일치하지 않습니다.");
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      await signup(email.trim(), password, username.trim());
      router.replace("/onboarding/profile");
    } catch (error) {
      Alert.alert("회원가입 실패", "회원가입 중 오류가 발생했습니다.");
    }
  };

  const handleLogin = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>계정 생성</Text>

              <Text style={styles.subtitle}>
                이메일과 비밀번호를 설정해주세요
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="사용자 이름"
                placeholderTextColor="#999999"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="nickname"
                returnKeyType="next"
                editable={!isSubmitting}
              />

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@snu.ac.kr"
                placeholderTextColor="#999999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                returnKeyType="next"
                editable={!isSubmitting}
              />

              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호"
                placeholderTextColor="#999999"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                returnKeyType="next"
                editable={!isSubmitting}
              />

              <TextInput
                style={styles.input}
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                placeholder="비밀번호 확인"
                placeholderTextColor="#999999"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
                editable={!isSubmitting}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.buttonPressed,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={handleSignup}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? "생성 중..." : "계정 생성"}
                </Text>
              </Pressable>

              <View style={styles.loginRow}>
                <Text style={styles.loginDescription}>
                  이미 계정이 있으신가요?
                </Text>

                <Pressable
                  onPress={handleLogin}
                  hitSlop={8}
                  style={({ pressed }) => pressed && styles.loginPressed}
                >
                  <Text style={styles.loginLink}>로그인하러 가기</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboardView: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    paddingHorizontal: 32,
  },

  // ---------------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------------

  header: {
    alignItems: "center",

    // 사진 기준 상단에서 충분히 띄움
    marginTop: 190,
    marginBottom: 60,
  },

  title: {
    color: "#111111",
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -1.2,
    textAlign: "center",
  },

  subtitle: {
    marginTop: 18,

    color: "#333333",
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
    textAlign: "center",
  },

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------

  form: {
    width: "100%",
    gap: 18,
  },

  input: {
    width: "100%",
    height: 58,

    paddingHorizontal: 20,

    borderWidth: 1,
    borderColor: "#DEDEDE",
    borderRadius: 999,

    backgroundColor: "#FFFFFF",

    color: "#111111",
    fontSize: 16,
    fontWeight: "600",

    // iOS
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.025,
    shadowRadius: 4,

    // Android
    elevation: 1,
  },

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  submitButton: {
    width: "100%",
    height: 62,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 4,

    borderRadius: 999,

    backgroundColor: "#000000",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,

    elevation: 4,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.55,
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ translateY: 1 }],
  },

  // ---------------------------------------------------------------------------
  // Login link
  // ---------------------------------------------------------------------------

  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 12,
  },

  loginDescription: {
    color: "#8A8A8A",
    fontSize: 15,
    fontWeight: "500",
  },

  loginLink: {
    marginLeft: 8,

    color: "#777777",
    fontSize: 15,
    fontWeight: "600",

    textDecorationLine: "underline",
  },

  loginPressed: {
    opacity: 0.55,
  },
});
