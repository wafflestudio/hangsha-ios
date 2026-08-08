import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useUserData } from '@/contexts/UserDataContext';
import type { Category } from '@/types/category';

const MAX_PREFERENCES = 3;

export default function InterestOnboardingScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Category[]>([]);
  const hasInitializedSelection = useRef(false);
  const {
    programTypes,
    organizations,
    isLoadingMeta,
    metadataError,
    refreshMetadata,
  } = useOnboarding();
  const {
    interestCategories,
    interestCategoriesLoading,
    interestCategoriesSaving,
    interestCategoriesError,
    refreshUserData,
    saveInterestPreferences,
  } = useUserData();

  useEffect(() => {
    if (interestCategoriesLoading || hasInitializedSelection.current) return;
    setSelected(interestCategories);
    hasInitializedSelection.current = true;
  }, [interestCategories, interestCategoriesLoading]);

  const toggle = (category: Category) => {
    setSelected((current) => {
      const exists = current.some((item) => item.id === category.id && item.groupId === category.groupId);
      if (exists) return current.filter((item) => !(item.id === category.id && item.groupId === category.groupId));
      if (current.length >= MAX_PREFERENCES) {
        Alert.alert('선택 제한', `관심사는 최대 ${MAX_PREFERENCES}개까지 선택할 수 있습니다.`);
        return current;
      }
      return [...current, category];
    });
  };

  const submit = async () => {
    if (interestCategoriesSaving) return;
    try {
      await saveInterestPreferences(selected);
      router.replace('/onboarding/complete');
    } catch {
      Alert.alert('저장 실패', '관심사를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  if (isLoadingMeta || interestCategoriesLoading) {
    return <Loading label="관심사 목록을 불러오는 중..." />;
  }
  if (metadataError) {
    return <Loading label="관심사 목록을 불러오지 못했습니다." retry={refreshMetadata} />;
  }
  if (interestCategoriesError) {
    return <Loading label="저장된 관심사를 불러오지 못했습니다." retry={refreshUserData} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>관심사 설정</Text>
          <Text style={styles.subtitle}>먼저 보고 싶은 행사의 카테고리 또는 주최기관을 선택해주세요.</Text>
        </View>
        <View style={styles.selected}>
          {selected.length === 0 ? <Text style={styles.selectedHint}>최대 3개까지, 선택한 순서대로 저장돼요.</Text> : selected.map((item, index) => <View key={`${item.groupId}-${item.id}`} style={styles.rankPill}><Text style={styles.rankText}>{index + 1}순위: {item.name}</Text></View>)}
        </View>
        <ScrollView contentContainerStyle={styles.sections} showsVerticalScrollIndicator={false}>
          <OptionSection title="카테고리" items={programTypes} selected={selected} onToggle={toggle} />
          <OptionSection title="주최기관" items={organizations} selected={selected} onToggle={toggle} />
        </ScrollView>
        <Pressable onPress={submit} disabled={interestCategoriesSaving} style={[styles.button, interestCategoriesSaving && styles.disabled]}><Text style={styles.buttonText}>{interestCategoriesSaving ? '저장 중...' : '완료'}</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

function OptionSection({ title, items, selected, onToggle }: { title: string; items: Category[]; selected: Category[]; onToggle: (item: Category) => void }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.options}>{items.map((item) => { const isSelected = selected.some((value) => value.id === item.id && value.groupId === item.groupId); return <Pressable key={`${item.groupId}-${item.id}`} onPress={() => onToggle(item)} style={[styles.pill, isSelected && styles.pillSelected]}><Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{item.name}</Text></Pressable>; })}</View></View>;
}

function Loading({ label, retry }: { label: string; retry?: () => void }) {
  return <SafeAreaView style={styles.loading}><Text style={styles.loadingText}>{label}</Text>{retry && <Pressable onPress={retry} style={styles.retry}><Text style={styles.retryText}>다시 시도</Text></Pressable>}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' }, container: { flex: 1, paddingHorizontal: 24 },
  header: { paddingTop: 28, alignItems: 'center' }, title: { fontSize: 29, fontWeight: '800', color: '#161616' }, subtitle: { marginTop: 12, color: '#555', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  selected: { minHeight: 66, marginVertical: 22, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start', gap: 8 }, selectedHint: { color: '#888', fontSize: 14 }, rankPill: { backgroundColor: '#E6F4FE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 }, rankText: { color: '#176DB9', fontWeight: '700' },
  sections: { paddingBottom: 20, gap: 28 }, section: { gap: 14 }, sectionTitle: { color: '#222', fontWeight: '800', fontSize: 19 }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, pill: { borderWidth: 1, borderColor: '#D4D4D4', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10 }, pillSelected: { borderColor: '#208AEF', backgroundColor: '#208AEF' }, pillText: { color: '#555', fontWeight: '600' }, pillTextSelected: { color: '#fff' },
  button: { height: 56, backgroundColor: '#208AEF', marginBottom: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }, disabled: { opacity: 0.6 }, buttonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', gap: 18 }, loadingText: { color: '#555' }, retry: { paddingHorizontal: 16, paddingVertical: 10 }, retryText: { color: '#208AEF', fontWeight: '800' },
});
