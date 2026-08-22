import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthProvider';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useUserData } from '@/contexts/UserDataContext';
import type { InterestCategory } from '@/types/category';

const MAX_PREFERENCES = 3;

export default function InterestOnboardingScreen() {
  const router = useRouter();
  const { finishOnboarding } = useAuth();
  const [selected, setSelected] = useState<InterestCategory[]>([]);
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

  const toggle = (category: InterestCategory) => {
    setSelected((current) => {
      const exists = current.some(
        (item) => item.id === category.id && item.categoryType === category.categoryType,
      );
      if (exists) {
        return current.filter(
          (item) => !(item.id === category.id && item.categoryType === category.categoryType),
        );
      }
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
      finishOnboarding();
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
          <Text style={styles.subtitle}>
            먼저 보고 싶은 행사의 카테고리 또는 주최기관을 선택해주세요.
          </Text>
        </View>
        <View style={styles.selected}>
          {selected.length === 0 ? (
            <Text style={styles.selectedHint}>최대 3개까지, 선택한 순서대로 저장돼요.</Text>
          ) : (
            selected.map((item, index) => (
              <View key={`${item.categoryType}-${item.id}`} style={styles.rankPill}>
                <Text style={styles.rankLabel}>{index + 1}순위:</Text>
                <Text style={styles.rankText}>{item.name}</Text>
              </View>
            ))
          )}
        </View>
        <ScrollView contentContainerStyle={styles.sections} showsVerticalScrollIndicator={false}>
          <OptionSection
            title="카테고리"
            tone="category"
            items={programTypes}
            selected={selected}
            onToggle={toggle}
          />
          <OptionSection
            title="주최기관"
            tone="organization"
            items={organizations}
            selected={selected}
            onToggle={toggle}
          />
        </ScrollView>
        <Pressable
          onPress={submit}
          disabled={interestCategoriesSaving}
          style={[styles.button, interestCategoriesSaving && styles.disabled]}>
            <Text style={styles.buttonText}>
              {interestCategoriesSaving ? '저장 중...' : '완료'}
            </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function OptionSection({
  title,
  tone,
  items,
  selected,
  onToggle,
}: {
  title: string;
  tone: 'category' | 'organization';
  items: InterestCategory[];
  selected: InterestCategory[];
  onToggle: (item: InterestCategory) => void;
}) {
  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          tone === 'category' ? styles.categoryTitle : styles.organizationTitle,
        ]}>
        {title}
      </Text>
      <View style={styles.options}>
        {items.map((item) => {
          const isSelected = selected.some(
            (value) => value.id === item.id && value.categoryType === item.categoryType,
          );
          return (
            <Pressable
              key={`${item.categoryType}-${item.id}`}
              onPress={() => onToggle(item)}
              style={({ pressed }) => [
                styles.pill,
                tone === 'category' ? styles.categoryPill : styles.organizationPill,
                isSelected && styles.pillSelected,
                pressed && styles.pillPressed,
              ]}>
              <Text style={styles.pillText}>{item.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Loading({ label, retry }: { label: string; retry?: () => void }) {
  return (
    <SafeAreaView style={styles.loading}>
      <Text style={styles.loadingText}>{label}</Text>
      {retry && (
        <Pressable onPress={retry} style={styles.retry}>
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 22 },
  header: { paddingTop: 28, alignItems: 'center' },
  title: { color: '#161616', fontSize: 27, fontWeight: '800', letterSpacing: -0.54 },
  subtitle: {
    marginTop: 12,
    color: '#666666',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  selected: {
    minHeight: 100,
    marginTop: 34,
    marginBottom: 38,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  selectedHint: { color: '#888888', fontSize: 13, textAlign: 'center' },
  rankPill: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 9,
    elevation: 4,
  },
  rankLabel: { color: '#777777', fontSize: 15, lineHeight: 21, fontWeight: '800' },
  rankText: { color: '#222222', fontSize: 15, lineHeight: 21, fontWeight: '800' },
  sections: { paddingBottom: 20, gap: 26 },
  section: { gap: 13 },
  sectionTitle: { fontWeight: '800', fontSize: 18, letterSpacing: -0.18 },
  categoryTitle: { color: '#16B7FF' },
  organizationTitle: { color: '#18B56C' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryPill: { backgroundColor: '#6FD2FF' },
  organizationPill: { backgroundColor: '#36C986' },
  pillSelected: { backgroundColor: '#BDBDBD', shadowOpacity: 0.05 },
  pillPressed: { opacity: 0.8 },
  pillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  button: {
    height: 52,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#208AEF',
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    backgroundColor: '#FFFFFF',
  },
  loadingText: { color: '#555555' },
  retry: { paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { color: '#208AEF', fontWeight: '800' },
});
