import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { BugReportForm } from '@/components/bug-report/BugReportForm';

export function BugReportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.backdrop} edges={['top', 'bottom', 'left', 'right']}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <Pressable accessibilityRole="button" accessibilityLabel="버그 신고 닫기" hitSlop={12} onPress={onClose} style={styles.closeButton}>
            <SymbolView name="xmark" size={20} tintColor="#777777" />
          </Pressable>
          <BugReportForm compact onSubmitted={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0, 0, 0, 0.42)' },
  card: { borderRadius: 24, backgroundColor: '#FFFFFF', padding: 24, shadowColor: '#000000', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  closeButton: { position: 'absolute', zIndex: 1, top: 20, right: 20, padding: 4 },
});
