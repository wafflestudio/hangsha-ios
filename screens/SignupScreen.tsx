import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { AdaptiveColors } from "@/util/theme";

type SignupStep = "email" | "code" | "password";

const VERIFICATION_CODE_LENGTH = 6;

const PASSWORD_REQUIREMENTS = [
  {
    key: "length",
    message: "비밀번호는 8자 이상이어야 합니다.",
    isMet: (value: string) => value.length >= 8,
  },
  {
    key: "characters",
    message: "영문, 숫자, 특수문자를 포함해 주세요.",
    isMet: (value: string) =>
      /[A-Za-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9\s]/.test(value),
  },
  {
    key: "spaces",
    message: "비밀번호에 공백을 사용할 수 없습니다.",
    isMet: (value: string) => !/\s/.test(value),
  },
] as const;

function getRemainingSeconds(expiresAt: string | null) {
  if (!expiresAt) return 0;

  const expiryTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiryTime)) return 0;
  return Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000));
}

function formatRemainingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const message = error.response?.data?.message?.trim();
    if (message) return message;
  }
  return fallback;
}

export default function SignupScreen() {
  const router = useRouter();
  const {
    signup,
    signupMutation,
    sendSignupEmailCode,
    sendSignupEmailCodeMutation,
    verifySignupEmailCode,
    verifySignupEmailCodeMutation,
  } = useAuth();

  const codeInputRef = useRef<TextInput>(null);
  const [step, setStep] = useState<SignupStep>("email");
  const [email, setEmail] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [signupToken, setSignupToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [hasAttemptedSignup, setHasAttemptedSignup] = useState(false);
  const [isPrivacyAgreed, setIsPrivacyAgreed] = useState(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);

  const isSendingCode = sendSignupEmailCodeMutation.isPending;
  const isVerifyingCode = verifySignupEmailCodeMutation.isPending;
  const isSubmitting = signupMutation.isPending;
  const isCodeExpired = step === "code" && remainingSeconds === 0;
  const passwordErrors = PASSWORD_REQUIREMENTS.filter(({ isMet }) => !isMet(password));
  const shouldShowPasswordErrors = password.length > 0 || hasAttemptedSignup;
  const showPasswordMismatch =
    (passwordConfirm.length > 0 || hasAttemptedSignup) && password !== passwordConfirm;

  useEffect(() => {
    if (!codeExpiresAt || step !== "code") return;

    const updateTimer = () => setRemainingSeconds(getRemainingSeconds(codeExpiresAt));
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [codeExpiresAt, step]);

  useEffect(() => {
    if (step !== "code") return;
    const focusTimer = setTimeout(() => codeInputRef.current?.focus(), 250);
    return () => clearTimeout(focusTimer);
  }, [step]);

  const validateEmail = (value: string) => {
    if (!value) {
      Alert.alert("알림", "이메일을 입력해주세요.");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      Alert.alert("알림", "올바른 이메일 주소를 입력해주세요.");
      return false;
    }
    return true;
  };

  const handleSendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!validateEmail(normalizedEmail) || isSendingCode) return;

    try {
      const response = await sendSignupEmailCode(normalizedEmail);
      setVerifiedEmail(normalizedEmail);
      setEmail(normalizedEmail);
      setVerificationCode("");
      setSignupToken("");
      setCodeExpiresAt(response.expiresAt);
      setRemainingSeconds(getRemainingSeconds(response.expiresAt));
      setStep("code");
    } catch (error) {
      Alert.alert(
        "인증번호 발송 실패",
        getApiErrorMessage(error, "인증번호를 보내지 못했습니다. 잠시 후 다시 시도해주세요."),
      );
    }
  };

  const handleResendCode = async () => {
    if (!verifiedEmail || isSendingCode) return;

    try {
      const response = await sendSignupEmailCode(verifiedEmail);
      setVerificationCode("");
      setCodeExpiresAt(response.expiresAt);
      setRemainingSeconds(getRemainingSeconds(response.expiresAt));
      codeInputRef.current?.focus();
    } catch (error) {
      Alert.alert(
        "인증번호 재발송 실패",
        getApiErrorMessage(error, "인증번호를 다시 보내지 못했습니다. 잠시 후 다시 시도해주세요."),
      );
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== VERIFICATION_CODE_LENGTH) {
      Alert.alert("알림", "6자리 인증번호를 입력해주세요.");
      return;
    }
    if (isCodeExpired) {
      Alert.alert("인증번호 만료", "인증번호를 다시 받아주세요.");
      return;
    }
    if (isVerifyingCode) return;

    try {
      const response = await verifySignupEmailCode(verifiedEmail, verificationCode);
      setSignupToken(response.signupToken);
      setStep("password");
    } catch (error) {
      Alert.alert(
        "이메일 인증 실패",
        getApiErrorMessage(error, "인증번호가 올바르지 않습니다. 다시 확인해주세요."),
      );
    }
  };

  const validatePassword = () => {
    setHasAttemptedSignup(true);
    return passwordErrors.length === 0 && password === passwordConfirm;
  };

  const handleSignup = async () => {
    if (!isPrivacyAgreed || !validatePassword() || isSubmitting) return;

    try {
      await signup(verifiedEmail, password, signupToken);
      router.replace("/onboarding/profile");
    } catch (error) {
      Alert.alert(
        "회원가입 실패",
        getApiErrorMessage(error, "회원가입 중 오류가 발생했습니다."),
      );
    }
  };

  const subtitle = step === "password" ? "비밀번호를 설정해주세요" : "이메일을 설정해주세요";

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.container, step === "code" && styles.codeContainer]}>
            <View style={styles.header}>
              <Text style={styles.title}>계정 생성</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            {step === "email" && (
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@snu.ac.kr"
                  placeholderTextColor={AdaptiveColors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={handleSendCode}
                  editable={!isSendingCode}
                />
                <PrimaryButton
                  label={isSendingCode ? "발송 중..." : "이메일 인증"}
                  onPress={handleSendCode}
                  disabled={isSendingCode}
                />
              </View>
            )}

            {step === "code" && (
              <View style={styles.form}>
                <TextInput
                  style={[styles.input, styles.readonlyInput]}
                  value={verifiedEmail}
                  editable={false}
                  accessibilityLabel="인증 이메일"
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.resendButton,
                    pressed && !isSendingCode && styles.buttonPressed,
                    isSendingCode && styles.disabledButton,
                  ]}
                  onPress={handleResendCode}
                  disabled={isSendingCode}
                >
                  <Text style={styles.resendButtonText}>
                    {isSendingCode ? "인증번호 보내는 중..." : "인증번호 다시 받기"}
                  </Text>
                </Pressable>

                <Text style={styles.codeGuide}>이메일로 온 인증번호를 확인해주세요!</Text>
                <Text style={[styles.timer, isCodeExpired && styles.expiredTimer]}>
                  {isCodeExpired ? "인증번호가 만료되었습니다" : formatRemainingTime(remainingSeconds)}
                </Text>

                <View style={styles.codeInputContainer}>
                  {Array.from({ length: VERIFICATION_CODE_LENGTH }, (_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.codeBox,
                        verificationCode.length === index && !isCodeExpired && styles.activeCodeBox,
                      ]}
                    >
                      <Text style={styles.codeDigit}>{verificationCode[index] ?? ""}</Text>
                    </View>
                  ))}
                  <TextInput
                    ref={codeInputRef}
                    style={styles.codeInput}
                    value={verificationCode}
                    onChangeText={(value) =>
                      setVerificationCode(value.replace(/\D/g, "").slice(0, VERIFICATION_CODE_LENGTH))
                    }
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    maxLength={VERIFICATION_CODE_LENGTH}
                    caretHidden
                    contextMenuHidden
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyCode}
                    editable={!isVerifyingCode && !isCodeExpired}
                    accessibilityLabel="6자리 이메일 인증번호"
                  />
                </View>

                <PrimaryButton
                  label={isVerifyingCode ? "인증 중..." : "인증하기"}
                  onPress={handleVerifyCode}
                  disabled={
                    isVerifyingCode ||
                    isCodeExpired ||
                    verificationCode.length !== VERIFICATION_CODE_LENGTH
                  }
                />
              </View>
            )}

            {step === "password" && (
              <View style={styles.form}>
                <TextInput
                  style={[styles.input, styles.readonlyInput]}
                  value={verifiedEmail}
                  editable={false}
                  accessibilityLabel="인증된 이메일"
                />
                <View style={styles.passwordFieldGroup}>
                  <TextInput
                    style={[
                      styles.input,
                      shouldShowPasswordErrors && passwordErrors.length > 0 && styles.invalidInput,
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="비밀번호"
                    placeholderTextColor={AdaptiveColors.textMuted}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    returnKeyType="next"
                    editable={!isSubmitting}
                    accessibilityLabel="비밀번호"
                  />
                  {shouldShowPasswordErrors &&
                    passwordErrors.map(({ key, message }) => (
                      <ValidationMessage key={key} message={message} />
                    ))}
                </View>

                <View style={styles.passwordFieldGroup}>
                  <TextInput
                    style={[styles.input, showPasswordMismatch && styles.invalidInput]}
                    value={passwordConfirm}
                    onChangeText={setPasswordConfirm}
                    placeholder="비밀번호 확인"
                    placeholderTextColor={AdaptiveColors.textMuted}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={handleSignup}
                    editable={!isSubmitting}
                    accessibilityLabel="비밀번호 확인"
                  />
                  {showPasswordMismatch && (
                    <ValidationMessage message="비밀번호가 일치하지 않습니다." />
                  )}
                </View>

                <View style={styles.consentRow}>
                  <Pressable
                    style={styles.consentControl}
                    onPress={() => setIsPrivacyAgreed((agreed) => !agreed)}
                    disabled={isSubmitting}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isPrivacyAgreed, disabled: isSubmitting }}
                    accessibilityLabel="개인정보 약관 동의 필수"
                    hitSlop={6}
                  >
                    <View style={[styles.checkbox, isPrivacyAgreed && styles.checkboxChecked]}>
                      {isPrivacyAgreed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.consentLabel}>개인정보 약관 동의(필수)</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setIsPrivacyModalVisible(true)}
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Text style={styles.detailsLink}>상세 내용 보기</Text>
                  </Pressable>
                </View>

                <PrimaryButton
                  label={isSubmitting ? "생성 중..." : "계정 생성"}
                  onPress={handleSignup}
                  disabled={!isPrivacyAgreed || isSubmitting}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PrivacyPolicyModal
        visible={isPrivacyModalVisible}
        onClose={() => setIsPrivacyModalVisible(false)}
      />
    </SafeAreaView>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function ValidationMessage({ message }: { message: string }) {
  return (
    <View style={styles.validationMessage} accessibilityRole="alert">
      <View style={styles.validationIcon}>
        <Text style={styles.validationIconText}>!</Text>
      </View>
      <Text style={styles.validationText}>{message}</Text>
    </View>
  );
}

function PrivacyPolicyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>개인정보 수집·이용 동의</Text>
              <Pressable onPress={onClose} accessibilityRole="button" hitSlop={10}>
                <Text style={styles.modalCloseIcon}>×</Text>
              </Pressable>
            </View>
            <ScrollView
              style={styles.policyScroll}
              contentContainerStyle={styles.policyContent}
              showsVerticalScrollIndicator
            >
              <Text style={styles.policyHeading}>○ 개인정보 수집 및 이용에 대한 동의</Text>
              <Text style={styles.policyParagraph}>
                서비스는 회원가입 및 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용합니다.
              </Text>

              <View style={styles.policyTable}>
                <PolicyTableRow
                  header
                  cells={["수집 항목", "수집 목적", "보유 및 이용 기간"]}
                />
                <PolicyTableRow
                  cells={[
                    "이메일 주소",
                    "회원 식별, 로그인, 계정 관리, 서비스 이용 안내",
                    "회원 탈퇴 시까지 (단, 관계 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관)",
                  ]}
                />
                <PolicyTableRow
                  cells={["비밀번호(암호화 저장)", "회원 인증 및 계정 보호", "회원 탈퇴 시까지"]}
                />
                <PolicyTableRow
                  cells={["닉네임(선택)", "서비스 내 사용자 식별", "회원 탈퇴 시까지"]}
                />
              </View>

              <Text style={styles.policySectionTitle}>수집 목적</Text>
              <Text style={styles.policyList}>• 회원가입 및 본인 식별</Text>
              <Text style={styles.policyList}>• 로그인 및 계정 관리</Text>
              <Text style={styles.policyList}>• 서비스 제공 및 운영</Text>

              <Text style={styles.policySectionTitle}>보유 및 이용 기간</Text>
              <Text style={styles.policyParagraph}>
                원칙적으로 회원 탈퇴 시 개인정보를 지체 없이 파기합니다.
              </Text>
              <Text style={styles.policyParagraph}>
                다만, 다음의 경우 관련 법령에 따라 일정 기간 보관할 수 있습니다.
              </Text>
              <Text style={styles.policyList}>• 계약 또는 청약철회 등에 관한 기록: 5년</Text>
              <Text style={styles.policyList}>• 소비자의 불만 또는 분쟁처리에 관한 기록: 3년</Text>
              <Text style={styles.policyList}>• 전자적 접속기록: 관련 법령에 따른 보관 기간</Text>

              <Text style={styles.policyNotice}>
                ※ 귀하는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 다만, 필수
                항목에 대한 동의를 거부하는 경우 회원가입 및 서비스 이용이 제한될 수 있습니다.
              </Text>
            </ScrollView>
            <Pressable style={styles.modalCloseButton} onPress={onClose} accessibilityRole="button">
              <Text style={styles.modalCloseButtonText}>닫기</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function PolicyTableRow({ cells, header = false }: { cells: string[]; header?: boolean }) {
  return (
    <View style={[styles.policyTableRow, header && styles.policyTableHeader]}>
      {cells.map((cell, index) => (
        <View
          key={`${cell}-${index}`}
          style={[styles.policyTableCell, index === 0 && styles.policyTableFirstCell]}
        >
          <Text style={[styles.policyTableText, header && styles.policyTableHeaderText]}>{cell}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AdaptiveColors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingTop: 190,
  },
  codeContainer: { paddingTop: 110 },
  header: { alignItems: "center", marginBottom: 28 },
  title: {
    color: AdaptiveColors.text,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "800",
    letterSpacing: -0.8,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    color: AdaptiveColors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
    textAlign: "center",
  },
  form: { width: "100%", gap: 24 },
  input: {
    width: "100%",
    height: 42,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: AdaptiveColors.border,
    borderRadius: 999,
    backgroundColor: AdaptiveColors.input,
    color: AdaptiveColors.text,
    fontSize: 17,
  },
  passwordFieldGroup: { width: "100%", gap: 8 },
  invalidInput: { borderColor: "#FF3158" },
  validationMessage: {
    width: "100%",
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#FF3158",
    borderRadius: 999,
    backgroundColor: "#FFD6DE",
  },
  validationIcon: {
    width: 29,
    height: 29,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#FF3158",
    borderRadius: 15,
  },
  validationIconText: {
    color: "#FF3158",
    fontSize: 20,
    lineHeight: 23,
    fontWeight: "700",
  },
  validationText: {
    flex: 1,
    color: AdaptiveColors.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
  readonlyInput: { color: AdaptiveColors.textMuted, backgroundColor: AdaptiveColors.backgroundElement },
  primaryButton: {
    width: "100%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: AdaptiveColors.accent,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  resendButton: {
    width: "100%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#757575",
  },
  resendButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  disabledButton: { opacity: 0.45 },
  buttonPressed: { opacity: 0.75 },
  codeGuide: {
    marginTop: 2,
    color: AdaptiveColors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  timer: {
    marginTop: 2,
    color: "#FF0000",
    fontSize: 17,
    lineHeight: 22,
    textAlign: "center",
  },
  expiredTimer: { fontSize: 14 },
  codeInputContainer: {
    position: "relative",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  codeBox: {
    flex: 1,
    height: 72,
    maxWidth: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AdaptiveColors.border,
    borderRadius: 9,
    backgroundColor: AdaptiveColors.surface,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  activeCodeBox: { borderColor: AdaptiveColors.borderStrong, borderWidth: 1.5 },
  codeDigit: { color: AdaptiveColors.text, fontSize: 24, fontWeight: "600" },
  codeInput: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    color: "transparent",
    backgroundColor: "transparent",
  },
  consentRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  consentControl: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  checkbox: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: AdaptiveColors.borderStrong,
    borderRadius: 3,
    backgroundColor: AdaptiveColors.surface,
  },
  checkboxChecked: { borderColor: AdaptiveColors.accent, backgroundColor: AdaptiveColors.accent },
  checkmark: { color: "#FFFFFF", fontSize: 12, lineHeight: 14, fontWeight: "800" },
  consentLabel: { color: AdaptiveColors.text, fontSize: 15, lineHeight: 20 },
  detailsLink: { color: AdaptiveColors.textSecondary, fontSize: 15, lineHeight: 20 },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: AdaptiveColors.overlay,
  },
  modalSafeArea: { width: "100%", maxWidth: 560, maxHeight: "88%", alignSelf: "center" },
  modalCard: {
    flexShrink: 1,
    maxHeight: "100%",
    borderRadius: 18,
    backgroundColor: AdaptiveColors.surfaceElevated,
    overflow: "hidden",
  },
  modalHeader: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AdaptiveColors.border,
  },
  modalTitle: { color: AdaptiveColors.text, fontSize: 19, fontWeight: "800" },
  modalCloseIcon: { color: AdaptiveColors.icon, fontSize: 30, lineHeight: 32, fontWeight: "300" },
  policyScroll: { flexShrink: 1 },
  policyContent: { padding: 20 },
  policyHeading: { color: AdaptiveColors.text, fontSize: 17, lineHeight: 24, fontWeight: "800" },
  policySectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    color: AdaptiveColors.text,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
  },
  policyParagraph: { marginTop: 12, color: AdaptiveColors.textSecondary, fontSize: 14, lineHeight: 21 },
  policyList: { marginTop: 5, color: AdaptiveColors.textSecondary, fontSize: 14, lineHeight: 21 },
  policyNotice: {
    marginTop: 24,
    color: AdaptiveColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  policyTable: {
    marginTop: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: AdaptiveColors.border,
  },
  policyTableRow: { flexDirection: "row" },
  policyTableHeader: { backgroundColor: AdaptiveColors.backgroundElement },
  policyTableCell: {
    flex: 1.35,
    minHeight: 48,
    justifyContent: "center",
    padding: 7,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: AdaptiveColors.border,
  },
  policyTableFirstCell: { flex: 0.8 },
  policyTableText: { color: AdaptiveColors.textSecondary, fontSize: 11, lineHeight: 16 },
  policyTableHeaderText: { color: AdaptiveColors.text, fontWeight: "700", textAlign: "center" },
  modalCloseButton: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: AdaptiveColors.accent,
  },
  modalCloseButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
