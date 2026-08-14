import { FontAwesomeFreeSolid } from '@react-native-vector-icons/fontawesome-free-solid';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useBugReport } from '@/contexts/BugReportContext';

type BugReportFormProps = {
  onSubmitted?: () => void;
  compact?: boolean;
};

/** Shared by My Page and the event-detail report dialog. */
export function BugReportForm({ onSubmitted, compact = false }: BugReportFormProps) {
  const { isSubmitting, submitBugReport } = useBugReport();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const submit = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) {
      Alert.alert('내용을 확인해주세요', '제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      await submitBugReport({ title: trimmedTitle, content: trimmedContent });
      setTitle('');
      setContent('');
      Alert.alert('접수 완료', '버그 신고가 접수되었습니다.');
      onSubmitted?.();
    } catch {
      Alert.alert('접수 실패', '버그 신고를 접수하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <View style={compact ? styles.compactContainer : styles.container}>
      <View style={styles.header}>
        <FontAwesomeFreeSolid name="bug" size={20} color="#222222" />
        <Text style={styles.title}>버그 신고</Text>
      </View>
      <Text style={styles.description}>이용 중 발견한 문제를 알려주세요.</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        editable={!isSubmitting}
        maxLength={100}
        placeholder="제목"
        placeholderTextColor="#999999"
        style={styles.input}
      />
      <TextInput
        value={content}
        onChangeText={setContent}
        editable={!isSubmitting}
        maxLength={1000}
        multiline
        textAlignVertical="top"
        placeholder="문제가 발생한 상황을 자세히 적어주세요."
        placeholderTextColor="#999999"
        style={[styles.input, styles.textArea, compact && styles.compactTextArea]}
      />
      <Pressable
        accessibilityRole="button"
        onPress={submit}
        disabled={isSubmitting}
        style={({ pressed }) => [styles.submitButton, pressed && styles.pressed, isSubmitting && styles.disabled]}>
        <Text style={styles.submitText}>{isSubmitting ? '접수 중' : '신고하기'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  compactContainer: { gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#222222', fontSize: 20, fontWeight: '700' },
  description: { color: '#777777', fontSize: 15, lineHeight: 22 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#DDDDDD', borderRadius: 12, paddingHorizontal: 16, color: '#222222', fontSize: 16 },
  textArea: { minHeight: 132, paddingTop: 14 },
  compactTextArea: { minHeight: 150 },
  submitButton: { alignSelf: 'flex-end', minWidth: 132, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#4C4C4C', paddingHorizontal: 20 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.5 },
});
