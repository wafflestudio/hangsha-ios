import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import type { SnuttFullTimetable } from '@/util/timetable/snuttTimetable';
import { parseSnuttWebViewMessage } from '@/util/timetable/snuttTimetable';
import { AdaptiveColors } from '@/util/theme';

type SnuttTimetablePickerModalProps = {
  visible: boolean;
  pickerUrl: string;
  snuttOrigin: string;
  onClose: () => void;
  onSelect: (timetable: SnuttFullTimetable) => void;
};

export function SnuttTimetablePickerModal({
  visible,
  pickerUrl,
  snuttOrigin,
  onClose,
  onSelect,
}: SnuttTimetablePickerModalProps) {
  const openerBridgeScript = useMemo(
    () => `
      (() => {
        if (window.location.origin === ${JSON.stringify(snuttOrigin)} && window.opener == null) {
          window.opener = window;
        }
      })();
      true;
    `,
    [snuttOrigin],
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    let messageOrigin: string;
    try {
      messageOrigin = new URL(event.nativeEvent.url).origin;
    } catch {
      return;
    }

    if (messageOrigin !== snuttOrigin) return;

    const timetable = parseSnuttWebViewMessage(event.nativeEvent.data);
    if (timetable) onSelect(timetable);
  };

  return (
    <Modal
      allowSwipeDismissal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.header}>
            <Text style={styles.title}>SNUTT 시간표 선택</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="SNUTT 시간표 선택 닫기"
              hitSlop={10}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              onPress={onClose}>
              <SymbolView name="xmark" tintColor={AdaptiveColors.text} size={18} weight="semibold" />
            </Pressable>
          </View>

          {visible ? (
            <WebView
              source={{ uri: pickerUrl }}
              originWhitelist={['https://*']}
              injectedJavaScriptBeforeContentLoaded={openerBridgeScript}
              javaScriptCanOpenWindowsAutomatically
              setSupportMultipleWindows={false}
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loading}>
                  <ActivityIndicator color={AdaptiveColors.accent} />
                </View>
              )}
              onMessage={handleMessage}
              style={styles.webView}
            />
          ) : null}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AdaptiveColors.background },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AdaptiveColors.border,
  },
  title: { color: AdaptiveColors.text, fontSize: 17, fontWeight: '700' },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: AdaptiveColors.backgroundElement,
  },
  webView: { flex: 1, backgroundColor: AdaptiveColors.background },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AdaptiveColors.surface,
  },
  pressed: { opacity: 0.62 },
});
