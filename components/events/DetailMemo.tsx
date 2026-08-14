import { FontAwesomeFreeSolid } from '@react-native-vector-icons/fontawesome-free-solid';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/contexts/AuthProvider';
import { useUserData } from '@/contexts/UserDataContext';
import type { Memo } from '@/types/userData';

const normalizeTag = (value: string) => value.trim().replace(/^#+/, '');

export type DetailMemoHandle = {
  blur: () => void;
};

export const DetailMemo = forwardRef<DetailMemoHandle, { eventId: number }>(function DetailMemo({ eventId }, ref) {
  const { isAuthenticated } = useAuth();
  const { eventMemos, memoLoading, addMemo, updateMemo } = useUserData();
  const currentMemo = eventMemos.find((memo) => memo.eventId === eventId);

  return (
    <DetailMemoEditor
      ref={ref}
      key={`${eventId}:${currentMemo?.id ?? 'new'}:${currentMemo?.updatedAt.getTime() ?? ''}`}
      eventId={eventId}
      isAuthenticated={isAuthenticated}
      currentMemo={currentMemo}
      memoLoading={memoLoading}
      addMemo={addMemo}
      updateMemo={updateMemo}
    />
  );
});

type DetailMemoEditorProps = {
  eventId: number;
  isAuthenticated: boolean;
  currentMemo: Memo | undefined;
  memoLoading: boolean;
  addMemo: (eventId: number, content: string, tagNames: string[]) => Promise<void>;
  updateMemo: (id: number, updates: { content?: string; tagNames?: string[] }) => Promise<Memo>;
};

const DetailMemoEditor = forwardRef<DetailMemoHandle, DetailMemoEditorProps>(function DetailMemoEditor({
  eventId,
  isAuthenticated,
  currentMemo,
  memoLoading,
  addMemo,
  updateMemo,
}, ref) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState(currentMemo?.content ?? '');
  const [tags, setTags] = useState<string[]>(currentMemo?.tags.map((tag) => tag.name) ?? []);
  const [tagInput, setTagInput] = useState('');
  const inputRef = useRef<TextInput>(null);
  const tagInputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    blur: () => {
      inputRef.current?.blur();
      tagInputRef.current?.blur();
      setExpanded(false);
    },
  }), []);

  const savedTags = currentMemo?.tags.map((tag) => tag.name) ?? [];
  const tagsChanged = JSON.stringify([...tags].sort()) !== JSON.stringify([...savedTags].sort());
  const canSave = currentMemo
    ? content !== currentMemo.content || tagsChanged
    : content.trim().length > 0;

  const expand = () => {
    if (!isAuthenticated) {
      Alert.alert('로그인이 필요해요', '메모는 로그인 후 작성할 수 있습니다.');
      return;
    }
    setExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const addTag = () => {
    const tag = normalizeTag(tagInput);
    if (!tag) return;
    setTags((previous) => previous.some((item) => item.toLowerCase() === tag.toLowerCase()) ? previous : [...previous, tag]);
    setTagInput('');
  };

  const save = async () => {
    if (!canSave || memoLoading) return;
    try {
      if (currentMemo) {
        await updateMemo(currentMemo.id, {
          ...(content !== currentMemo.content ? { content } : {}),
          ...(tagsChanged ? { tagNames: tags } : {}),
        });
      } else {
        await addMemo(eventId, content, tags);
      }
      setExpanded(false);
    } catch {
      Alert.alert('저장 실패', '메모를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <View style={[styles.container, expanded && styles.expanded]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={expand} style={styles.heading}>
          <FontAwesomeFreeSolid name="pen" size={16} color="#828282" />
          <Text style={styles.headingText}>메모하기</Text>
        </Pressable>
        {canSave && <Pressable accessibilityRole="button" onPress={save} disabled={memoLoading} style={styles.saveButton}><Text style={styles.saveText}>{memoLoading ? '저장 중' : '저장하기'}</Text></Pressable>}
      </View>
      <TextInput
        ref={inputRef}
        value={content}
        onChangeText={setContent}
        onFocus={expand}
        editable={isAuthenticated && !memoLoading}
        multiline={expanded}
        numberOfLines={expanded ? 5 : 1}
        textAlignVertical={expanded ? 'top' : 'center'}
        placeholder={isAuthenticated ? '메모를 입력하세요' : '로그인 이후 작성 가능합니다.'}
        placeholderTextColor="#B5B5B5"
        style={[styles.memoInput, expanded && styles.memoTextArea]}
      />
      {expanded && <View style={styles.tagEditor}>
        <TextInput ref={tagInputRef} value={tagInput} onChangeText={setTagInput} onSubmitEditing={addTag} returnKeyType="done" placeholder="태그 추가..." placeholderTextColor="#888888" style={styles.tagInput} />
        <Pressable accessibilityRole="button" onPress={addTag} disabled={!normalizeTag(tagInput)} style={[styles.addButton, !normalizeTag(tagInput) && styles.addDisabled]}><Text style={styles.addText}>추가</Text></Pressable>
      </View>}
      {tags.length > 0 && <View style={styles.tagList}>{tags.map((tag) => <View key={tag} style={styles.tag}><Text style={styles.tagText}># {tag}</Text>{expanded && <Pressable accessibilityRole="button" onPress={() => setTags((previous) => previous.filter((item) => item !== tag))}><Text style={styles.removeText}>×</Text></Pressable>}</View>)}</View>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginTop: 28, gap: 12 },
  expanded: { borderWidth: 1, borderColor: '#DDDDDD', borderRadius: 18, padding: 18 },
  header: { minHeight: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, headingText: { color: '#777777', fontSize: 17, fontWeight: '700' },
  saveButton: { paddingVertical: 4 }, saveText: { color: '#666666', fontSize: 16, fontWeight: '700' },
  memoInput: { minHeight: 54, borderWidth: 1, borderColor: '#D6D6D6', borderRadius: 14, paddingHorizontal: 16, color: '#222222', fontSize: 16 },
  memoTextArea: { minHeight: 150, paddingTop: 14 },
  tagEditor: { flexDirection: 'row', gap: 10 }, tagInput: { flex: 1, height: 50, borderWidth: 1, borderColor: '#AAAAAA', borderRadius: 14, paddingHorizontal: 16, color: '#222222', fontSize: 16 },
  addButton: { minWidth: 72, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDDDDD', borderRadius: 14 }, addDisabled: { opacity: 0.45 }, addText: { color: '#777777', fontSize: 16, fontWeight: '700' },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, tag: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 22, backgroundColor: '#F0F0F0', paddingHorizontal: 14, paddingVertical: 9 }, tagText: { color: '#444444', fontSize: 15, fontWeight: '600' }, removeText: { color: '#888888', fontSize: 22, lineHeight: 18 },
});
