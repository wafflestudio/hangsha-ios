import { FontAwesomeFreeSolid } from '@react-native-vector-icons/fontawesome-free-solid';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MobileBottomNavigation } from '@/components/mobile-bottom-navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserData } from '@/contexts/UserDataContext';
import type { Memo } from '@/types/userData';

const MEMO_ACCENT_COLORS = ['#65D1E8', '#FFDA60', '#BE8AF4', '#77D9A5', '#FF9A9A'];

const formatMemoDate = (date: Date) =>
  `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate(),
  ).padStart(2, '0')}`;

export default function MemoScreen() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { eventMemos, memoLoading, refreshUserData, deleteMemo, updateMemo } = useUserData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const sortedMemos = useMemo(
    () => [...eventMemos].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()),
    [eventMemos],
  );

  const refresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshUserData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openEditor = (memo: Memo) => {
    setEditingMemo(memo);
    setDraftContent(memo.content);
  };

  const closeEditor = () => {
    if (isSaving) return;
    setEditingMemo(null);
    setDraftContent('');
  };

  const saveMemo = async () => {
    const content = draftContent.trim();
    if (!editingMemo || !content || isSaving) return;

    setIsSaving(true);
    try {
      await updateMemo(editingMemo.id, { content });
      setEditingMemo(null);
      setDraftContent('');
    } catch {
      Alert.alert('수정 실패', '메모를 수정하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (memo: Memo) => {
    Alert.alert('메모를 삭제할까요?', '삭제한 메모는 복구할 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMemo(memo.id);
          } catch {
            Alert.alert('삭제 실패', '메모를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.');
          }
        },
      },
    ]);
  };

  if (isAuthLoading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.centered} edges={['top', 'left', 'right']}>
          <ActivityIndicator color="#208AEF" />
        </SafeAreaView>
        <MobileBottomNavigation activeTab="memos" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.guestPage} edges={['top', 'left', 'right']}>
          <View style={styles.guestCard}>
            <Text style={styles.guestTitle}>로그인이 필요해요</Text>
            <Text style={styles.guestDescription}>행사에 남긴 메모를 확인하려면 로그인해주세요.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/')}
              style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}>
              <Text style={styles.loginButtonText}>로그인 · 회원가입</Text>
            </Pressable>
          </View>
        </SafeAreaView>
        <MobileBottomNavigation activeTab="memos" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 메모 목록</Text>
          <Image
            source={require('@/assets/images/pencil.svg')}
            style={styles.headerIcon}
            contentFit="contain"
          />
        </View>

        {memoLoading && sortedMemos.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#208AEF" />
            <Text style={styles.loadingText}>메모를 불러오는 중...</Text>
          </View>
        ) : (
          <FlatList
            data={sortedMemos}
            keyExtractor={(memo) => String(memo.id)}
            contentContainerStyle={[
              styles.listContent,
              sortedMemos.length === 0 && styles.emptyListContent,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor="#208AEF" />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Image
                  source={require('@/assets/images/pencil.svg')}
                  style={styles.emptyIcon}
                  contentFit="contain"
                />
                <Text style={styles.emptyTitle}>아직 메모가 없어요</Text>
                <Text style={styles.emptyDescription}>관심 있는 행사에 메모를 남겨보세요!</Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <MemoListCard
                memo={item}
                accentColor={MEMO_ACCENT_COLORS[index % MEMO_ACCENT_COLORS.length]}
                onEdit={() => openEditor(item)}
                onDelete={() => confirmDelete(item)}
              />
            )}
          />
        )}
      </SafeAreaView>

      <MobileBottomNavigation activeTab="memos" />

      <Modal
        visible={editingMemo !== null}
        transparent
        animationType="fade"
        onRequestClose={closeEditor}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeEditor} />
          <View style={styles.editorCard}>
            <Text style={styles.editorTitle}>메모 수정</Text>
            <Text numberOfLines={2} style={styles.editorEventTitle}>
              {editingMemo?.eventTitle}
            </Text>
            <TextInput
              value={draftContent}
              onChangeText={setDraftContent}
              editable={!isSaving}
              autoFocus
              multiline
              textAlignVertical="top"
              maxLength={1000}
              placeholder="메모를 입력해주세요."
              placeholderTextColor="#A0A0A0"
              style={styles.editorInput}
            />
            <View style={styles.editorActions}>
              <Pressable
                accessibilityRole="button"
                onPress={closeEditor}
                disabled={isSaving}
                style={({ pressed }) => [styles.editorButton, pressed && styles.pressed]}>
                <Text style={styles.cancelButtonText}>취소</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={saveMemo}
                disabled={isSaving || !draftContent.trim()}
                style={({ pressed }) => [
                  styles.editorButton,
                  styles.saveButton,
                  (isSaving || !draftContent.trim()) && styles.disabled,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.saveButtonText}>{isSaving ? '저장 중' : '저장'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function MemoListCard({
  memo,
  accentColor,
  onEdit,
  onDelete,
}: {
  memo: Memo;
  accentColor: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.memoCard}>
      <View style={styles.memoTopRow}>
        <View style={[styles.accentDot, { backgroundColor: accentColor }]} />
        <Text numberOfLines={1} style={styles.tagSummary}>
          {memo.tags.length > 0 ? memo.tags.map((tag) => tag.name).join(' · ') : '메모'}
        </Text>
        <FontAwesomeFreeSolid name="bookmark" size={23} color="#ABABAB" />
      </View>

      <Text style={styles.eventTitle}>{memo.eventTitle}</Text>
      <Text style={styles.memoDate}>{formatMemoDate(memo.createdAt)}</Text>
      <Text numberOfLines={3} style={styles.memoContent}>
        {memo.content}
      </Text>

      <View style={styles.cardActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="메모 삭제"
          hitSlop={10}
          onPress={onDelete}
          style={({ pressed }) => pressed && styles.pressed}>
          <FontAwesomeFreeSolid name="trash" size={22} color="#8E8E8E" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="메모 수정"
          hitSlop={10}
          onPress={onEdit}
          style={({ pressed }) => pressed && styles.pressed}>
          <FontAwesomeFreeSolid name="edit" size={23} color="#8E8E8E" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: '#777777', fontSize: 13 },
  header: {
    height: 74,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { color: '#171717', fontSize: 18, lineHeight: 25, fontWeight: '800' },
  headerIcon: { width: 22, height: 23 },
  listContent: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyListContent: { flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 70 },
  emptyIcon: { width: 40, height: 41, opacity: 0.55 },
  emptyTitle: { marginTop: 18, color: '#333333', fontSize: 17, fontWeight: '800' },
  emptyDescription: { marginTop: 7, color: '#888888', fontSize: 13 },
  memoCard: {
    minHeight: 220,
    marginBottom: 18,
    paddingHorizontal: 11,
    paddingTop: 17,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 4,
  },
  memoTopRow: { flexDirection: 'row', alignItems: 'center' },
  accentDot: { width: 22, height: 22, marginRight: 10, borderRadius: 11 },
  tagSummary: { flex: 1, color: '#858585', fontSize: 15 },
  eventTitle: {
    marginTop: 18,
    color: '#111111',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '800',
  },
  memoDate: { marginTop: 9, color: '#888888', fontSize: 13 },
  memoContent: { marginTop: 8, color: '#222222', fontSize: 14, lineHeight: 18 },
  cardActions: {
    marginTop: 'auto',
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  guestPage: { flex: 1 },
  guestCard: {
    marginHorizontal: 20,
    marginTop: 80,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  guestTitle: { color: '#222222', fontSize: 21, fontWeight: '800' },
  guestDescription: {
    marginTop: 10,
    color: '#777777',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    height: 50,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#208AEF',
  },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  editorCard: {
    width: '100%',
    maxWidth: 520,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  editorTitle: { color: '#171717', fontSize: 19, fontWeight: '800' },
  editorEventTitle: { marginTop: 8, color: '#777777', fontSize: 13, lineHeight: 18 },
  editorInput: {
    height: 150,
    marginTop: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 10,
    color: '#222222',
    fontSize: 15,
    lineHeight: 21,
    backgroundColor: '#FFFFFF',
  },
  editorActions: { marginTop: 16, flexDirection: 'row', gap: 10 },
  editorButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  saveButton: { borderColor: '#208AEF', backgroundColor: '#208AEF' },
  cancelButtonText: { color: '#666666', fontSize: 14, fontWeight: '700' },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.5 },
});
