import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { BugReportForm } from '@/components/bug-report/BugReportForm';
import { useScrollToFocusedInput } from '@/hooks/use-scroll-to-focused-input';
import { AdaptiveColors } from '@/util/theme';

export function BugReportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { scrollViewRef, handleInputFocus, handleInputBlur } = useScrollToFocusedInput();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.backdrop}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            <View style={styles.card}>
              <Pressable accessibilityRole="button" accessibilityLabel="버그 신고 닫기" hitSlop={12} onPress={onClose} style={styles.closeButton}>
                <SymbolView name="xmark" size={20} tintColor={AdaptiveColors.icon} />
              </Pressable>
              <BugReportForm
                compact
                onSubmitted={onClose}
                onInputFocus={handleInputFocus}
                onInputBlur={handleInputBlur}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AdaptiveColors.overlay },
  keyboardAvoidingView: { flex: 1 },
  scrollView: { flex: 1 },
  backdrop: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { borderRadius: 24, backgroundColor: AdaptiveColors.surfaceElevated, padding: 24, shadowColor: '#000000', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  closeButton: { position: 'absolute', zIndex: 1, top: 20, right: 20, padding: 4 },
});
