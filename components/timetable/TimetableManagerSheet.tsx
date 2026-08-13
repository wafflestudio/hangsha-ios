import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
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
} from 'react-native';

import type { Timetable } from '@/types/timetable';

type NameMode = { type: 'create' } | { type: 'rename'; timetable: Timetable };

type TimetableManagerSheetProps = {
  timetables: Timetable[];
  selectedTimetableId: number | null;
  busy?: boolean;
  onClose: () => void;
  onSelect: (timetable: Timetable) => void;
  onCreate: (name: string) => Promise<void>;
  onRename: (timetable: Timetable, name: string) => Promise<void>;
  onDelete: (timetable: Timetable) => Promise<void>;
};

export function TimetableManagerSheet({
  timetables,
  selectedTimetableId,
  busy = false,
  onClose,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: TimetableManagerSheetProps) {
  const [nameMode, setNameMode] = useState<NameMode | null>(null);
  const [name, setName] = useState('');

  const openNameDialog = (mode: NameMode) => {
    setNameMode(mode);
    setName(mode.type === 'rename' ? mode.timetable.name : '');
  };

  const submitName = async () => {
    const trimmed = name.trim();
    if (!trimmed || !nameMode) return;
    if (nameMode.type === 'create') await onCreate(trimmed);
    else await onRename(nameMode.timetable, trimmed);
    setNameMode(null);
    setName('');
  };

  return (
    <>
      <Pressable style={styles.dim} accessibilityLabel="시간표 변경 닫기" onPress={onClose} />
      <View style={styles.sheet}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="시간표 변경 닫기"
          hitSlop={10}
          style={styles.closeButton}
          onPress={onClose}>
          <SymbolView name="chevron.right" tintColor="#8A8A8A" size={22} />
        </Pressable>

        <View style={styles.titleRow}>
          <Text style={styles.title}>나의 시간표</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="새 시간표 추가"
            hitSlop={8}
            onPress={() => openNameDialog({ type: 'create' })}>
            <SymbolView name="plus" tintColor="#777777" size={23} weight="medium" />
          </Pressable>
        </View>

        {timetables.length === 0 ? (
          <Text style={styles.empty}>새 시간표를 추가해 주세요.</Text>
        ) : (
          <ScrollView style={styles.listScroll} contentContainerStyle={styles.list} bounces={false}>
            {timetables.map((timetable) => {
              const selected = timetable.id === selectedTimetableId;
              return (
                <View key={timetable.id} style={[styles.item, selected && styles.itemSelected]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={styles.itemSelect}
                    onPress={() => onSelect(timetable)}>
                    <Text numberOfLines={1} style={[styles.itemName, !selected && styles.itemNameMuted]}>
                      {timetable.name || '이름 없는 시간표'}
                    </Text>
                  </Pressable>

                  <View style={styles.actions}>
                    <Pressable
                      disabled={busy}
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => openNameDialog({ type: 'rename', timetable })}>
                      <Text style={styles.actionText}>수정</Text>
                    </Pressable>
                    <Pressable
                      disabled={busy}
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() =>
                        Alert.alert('시간표 삭제', `'${timetable.name}' 시간표를 삭제할까요?`, [
                          { text: '취소', style: 'cancel' },
                          { text: '삭제', style: 'destructive', onPress: () => void onDelete(timetable) },
                        ])
                      }>
                      <Text style={styles.actionText}>삭제</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      <Modal transparent visible={nameMode !== null} animationType="fade" onRequestClose={() => setNameMode(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalDim}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>
              {nameMode?.type === 'create' ? '새 시간표 이름' : '시간표 이름 변경'}
            </Text>
            <TextInput
              autoFocus
              value={name}
              editable={!busy}
              maxLength={40}
              placeholder="시간표 이름"
              placeholderTextColor="#A0A0A0"
              returnKeyType="done"
              style={styles.input}
              onChangeText={setName}
              onSubmitEditing={() => void submitName()}
            />
            <View style={styles.dialogActions}>
              <Pressable style={styles.dialogCancel} onPress={() => setNameMode(null)}>
                <Text style={styles.dialogCancelText}>취소</Text>
              </Pressable>
              <Pressable
                disabled={!name.trim() || busy}
                style={[styles.dialogSubmit, (!name.trim() || busy) && styles.disabled]}
                onPress={() => void submitName()}>
                <Text style={styles.dialogSubmitText}>확인</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dim: { ...StyleSheet.absoluteFill, zIndex: 80, backgroundColor: 'transparent' },
  sheet: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 90,
    maxHeight: '72%',
    minHeight: 235,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EFEFF1',
    borderTopLeftRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 16,
  },
  closeButton: { alignSelf: 'flex-start', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  title: { color: '#111111', fontSize: 20, fontWeight: '700' },
  empty: { color: '#757575', fontSize: 14 },
  list: { gap: 8 },
  listScroll: { flexGrow: 0, maxHeight: 390 },
  item: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
  },
  itemSelected: { backgroundColor: 'rgba(0,192,232,0.12)' },
  itemSelect: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
  itemName: { color: '#1E1E1E', fontSize: 16 },
  itemNameMuted: { opacity: 0.68 },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    minWidth: 54,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  editButton: { backgroundColor: 'rgba(0,192,232,0.6)' },
  deleteButton: { backgroundColor: 'rgba(255,45,85,0.5)' },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  modalDim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  dialog: { width: '100%', maxWidth: 350, padding: 20, borderRadius: 18, backgroundColor: '#FFFFFF' },
  dialogTitle: { marginBottom: 14, color: '#111111', fontSize: 18, fontWeight: '700' },
  input: {
    height: 48,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#DEDEDE',
    borderRadius: 10,
    color: '#111111',
    fontSize: 16,
  },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 18 },
  dialogCancel: { paddingHorizontal: 16, paddingVertical: 10 },
  dialogCancelText: { color: '#666666', fontSize: 15, fontWeight: '600' },
  dialogSubmit: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: '#20C4DD' },
  dialogSubmitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.42 },
});
