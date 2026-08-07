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
import { SocialLoginError } from "@/types/socialAuth";

export default function HomeScreen() {
  const router = useRouter();
  const {
    login,
    loginMutation,
    loginWithSocial,
    socialLoginMutation,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginValid, setIsLoginValid] = useState(true);
  const isLoggingIn = loginMutation.isPending;
  const isSocialLoginPending = socialLoginMutation.isPending;
  const isBusy = isLoggingIn || isSocialLoginPending;

  /**
   * 일반 로그인
   */
  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("알림", "아이디를 입력하세요.");
      return;
    }

    if (!password.trim()) {
      Alert.alert("알림", "비밀번호를 입력하세요.");
      return;
    }

    if (isLoggingIn) {
      return;
    }

    try {
      setIsLoginValid(true);
      await login(email.trim(), password);
      router.replace("/calendar");
    } catch {
      setIsLoginValid(false);
    }
  };

  /**
   * Google 로그인
   */
  const handleGoogleLogin = async () => {
    try {
      await loginWithSocial("GOOGLE");
      router.replace("/calendar");
    } catch (error) {
      if (error instanceof SocialLoginError && error.code === "cancelled") {
        return;
      }

      Alert.alert(
        "구글 로그인 실패",
        error instanceof SocialLoginError
          ? error.message
          : "잠시 후 다시 시도해 주세요.",
      );
    }
  };

  /**
   * Kakao 로그인
   */
  const handleKakaoLogin = async () => {
    Alert.alert("알림", "카카오 로그인은 아직 지원하지 않습니다.");
  };

  /**
   * Naver 로그인
   */
  const handleNaverLogin = async () => {
    Alert.alert("알림", "네이버 로그인은 아직 지원하지 않습니다.");
  };

  /**
   * 회원가입
   */
  const handleSignUp = () => {
    router.push("/signup");
  };

  /**
   * 게스트로 계속하기
   */
  const handleGuest = () => {
    router.replace("/calendar");
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
            {/* Logo */}
            <View style={styles.brandContainer}>
              <Text style={styles.logo}>🎉</Text>

              <Text style={styles.title}>행샤</Text>
            </View>

            {/* Login */}
            <View style={styles.loginContainer}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);

                  if (!isLoginValid) {
                    setIsLoginValid(true);
                  }
                }}
                placeholder="아이디"
                placeholderTextColor="#858585"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                editable={!isBusy}
              />

              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);

                  if (!isLoginValid) {
                    setIsLoginValid(true);
                  }
                }}
                placeholder="비밀번호"
                placeholderTextColor="#858585"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!isBusy}
              />

              {!isLoginValid && (
                <Text style={styles.loginError}>
                  이메일 또는 비밀번호가 일치하지 않습니다.
                </Text>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.loginButton,
                  pressed && styles.buttonPressed,
                  isLoggingIn && styles.disabledButton,
                ]}
                onPress={handleLogin}
                disabled={isBusy}
              >
                <Text style={styles.loginButtonText}>
                  {isLoggingIn ? "로그인 중..." : "로그인"}
                </Text>
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Social Login */}
            <View style={styles.actionsContainer}>
              <SocialLoginButton
                text="구글 계정으로 계속하기"
                iconLabel="G"
                onPress={handleGoogleLogin}
                disabled={isBusy}
                isLoading={isSocialLoginPending}
              />

              <SocialLoginButton
                text="카카오톡 계정으로 계속하기"
                iconLabel="K"
                onPress={handleKakaoLogin}
                disabled={isBusy}
              />

              <SocialLoginButton
                text="네이버 계정으로 계속하기"
                iconLabel="N"
                onPress={handleNaverLogin}
                disabled={isBusy}
              />

              {/* Sign Up */}
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.signUpButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleSignUp}
              >
                <Text style={styles.signUpText}>회원가입</Text>
              </Pressable>

              {/* Guest */}
              <Pressable
                style={({ pressed }) => [
                  styles.guestButton,
                  pressed && styles.guestButtonPressed,
                ]}
                onPress={handleGuest}
              >
                <Text style={styles.guestText}>
                  로그인 없이 게스트로 계속하기
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface SocialLoginButtonProps {
  text: string;
  iconLabel: string;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

function SocialLoginButton({
  text,
  iconLabel,
  onPress,
  disabled = false,
  isLoading = false,
}: SocialLoginButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        styles.socialButton,
        pressed && styles.buttonPressed,
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.socialIcon}>{iconLabel}</Text>

      <Text style={styles.socialButtonText}>{isLoading ? "로그인 중..." : text}</Text>
    </Pressable>
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
    paddingBottom: 32,
  },

  // ---------------------------------------------------------------------------
  // Brand
  // ---------------------------------------------------------------------------

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 120,
    marginBottom: 148,
  },

  logo: {
    marginRight: 20,
    fontSize: 68,
    lineHeight: 88,
  },

  title: {
    color: "#000000",
    fontSize: 56,
    lineHeight: 64,
    fontWeight: "800",
    letterSpacing: -2,
  },

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------

  loginContainer: {
    width: "100%",
    gap: 14,
  },

  input: {
    width: "100%",
    height: 56,

    paddingHorizontal: 20,

    borderWidth: 1,
    borderColor: "#DEDEDE",
    borderRadius: 999,

    backgroundColor: "#FFFFFF",

    color: "#111111",
    fontSize: 16,
    fontWeight: "600",

    // iOS shadow
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,

    // Android
    elevation: 2,
  },

  loginError: {
    width: "100%",
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginVertical: 2,
  },

  button: {
    position: "relative",
    width: "100%",
    height: 56,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    borderRadius: 999,
  },

  loginButton: {
    marginTop: 2,

    backgroundColor: "#FFCC00",
    borderWidth: 0,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.07,
    shadowRadius: 8,

    elevation: 2,
  },

  loginButtonText: {
    color: "#111111",
    fontSize: 17,
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ translateY: 1 }],
  },

  // ---------------------------------------------------------------------------
  // Divider
  // ---------------------------------------------------------------------------

  divider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#CECECE",

    marginTop: 18,
    marginBottom: 20,
  },

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  actionsContainer: {
    width: "100%",
    gap: 14,
  },

  socialButton: {
    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E3E3E3",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.07,
    shadowRadius: 7,

    elevation: 2,
  },

  socialIcon: {
    position: "absolute",
    left: 20,
    width: 30,
    color: "#111111",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 30,
    textAlign: "center",
  },

  socialButtonText: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  // ---------------------------------------------------------------------------
  // Sign Up
  // ---------------------------------------------------------------------------

  signUpButton: {
    backgroundColor: "#B7B7B7",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 7,

    elevation: 2,
  },

  signUpText: {
    color: "#111111",
    fontSize: 17,
    fontWeight: "600",
  },

  // ---------------------------------------------------------------------------
  // Guest
  // ---------------------------------------------------------------------------

  guestButton: {
    minHeight: 42,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 4,
    paddingHorizontal: 16,
  },

  guestButtonPressed: {
    opacity: 0.6,
  },

  guestText: {
    color: "#6A6A6A",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
