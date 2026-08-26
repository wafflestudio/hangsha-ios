import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';

type AppleLoginButtonProps = {
  onPress: () => void;
  disabled?: boolean;
};

export function AppleLoginButton({ onPress, disabled = false }: AppleLoginButtonProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    let isMounted = true;
    void AppleAuthentication.isAvailableAsync().then((available) => {
      if (isMounted) setIsAvailable(available);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isAvailable) return null;

  return (
    <View style={disabled && styles.disabled} pointerEvents={disabled ? 'none' : 'auto'}>
      <AppleAuthentication.AppleAuthenticationButton
        accessibilityLabel="Apple로 로그인"
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={
          isDark
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={12}
        onPress={onPress}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: { width: '100%', height: 50 },
  disabled: { opacity: 0.6 },
});
