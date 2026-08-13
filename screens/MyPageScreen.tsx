import { FontAwesomeFreeSolid } from '@react-native-vector-icons/fontawesome-free-solid';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  type ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookmarkWidget } from '@/components/bookmarks/BookmarkWidget';
import { MobileBottomNavigation } from '@/components/mobile-bottom-navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { useBugReport } from '@/contexts/BugReportContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useUserData } from '@/contexts/UserDataContext';
import type { ProfileImage } from '@/types/auth';
import type { Category } from '@/types/category';
import type { Event } from '@/types/event';
import { formatDateDotParsed } from '@/util/calendar/dateFormatter';

const MAX_NAME_WEIGHT = 20;
const MAX_PREFERENCES = 3;

const isKoreanCharacter = (character: string) => /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(character);

const getNameWeight = (value: string) =>
  [...value].reduce((total, character) => total + (isKoreanCharacter(character) ? 2 : 1), 0);

const truncateToWeight = (value: string, maxWeight: number) => {
  let result = '';
  let weight = 0;

  for (const character of value) {
    const nextWeight = weight + (isKoreanCharacter(character) ? 2 : 1);
    if (nextWeight > maxWeight) break;
    result += character;
    weight = nextWeight;
  }

  return result;
};

export default function MyPageScreen() {
  const router = useRouter();
  const {
    user,
    isLoading: isAuthLoading,
    userQuery,
    updateUsername,
    setProfileImg,
    logout,
    deleteAccount,
    logoutMutation,
    deleteAccountMutation,
    updateUsernameMutation,
    uploadProfileImageMutation,
  } = useAuth();
  const {
    bookmarkedEvents,
    bookmarksLoading,
    eventMemos,
    interestCategories,
    interestCategoriesLoading,
    interestCategoriesSaving,
    refreshUserData,
    saveInterestPreferences,
    toggleBookmark,
  } = useUserData();
  const { programTypes, organizations, isLoadingMeta, metadataError, refreshMetadata } =
    useOnboarding();
  const { isSubmitting: isSubmittingBugReport, submitBugReport } = useBugReport();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [username, setUsername] = useState('');
  const [pendingImage, setPendingImage] = useState<ProfileImage | null>(null);
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInterestEditorOpen, setIsInterestEditorOpen] = useState(false);
  const [draftInterests, setDraftInterests] = useState<Category[]>([]);
  const [bugTitle, setBugTitle] = useState('');
  const [bugContent, setBugContent] = useState('');

  const isSavingProfile =
    updateUsernameMutation.isPending || uploadProfileImageMutation.isPending;
  const profileNameWeight = getNameWeight(username);

  useEffect(() => {
    setUsername(user?.username ?? '');
  }, [user?.username]);

  useEffect(() => {
    setProfileImageFailed(false);
  }, [user?.profileImageUrl]);

  const profileSource: ImageSourcePropType = pendingImage
    ? { uri: pendingImage.uri }
    : user?.profileImageUrl && !profileImageFailed
      ? { uri: user.profileImageUrl }
      : require('@/assets/images/defaultProfile.png');

  const startEditingProfile = () => {
    setUsername(user?.username ?? '');
    setPendingImage(null);
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    setUsername(user?.username ?? '');
    setPendingImage(null);
    setIsEditingProfile(false);
  };

  const pickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('사진 접근 권한 필요', '프로필 사진을 선택하려면 사진 보관함 접근을 허용해주세요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setPendingImage({
      uri: asset.uri,
      name: asset.fileName ?? 'profile-image.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    });
  };

  const saveProfile = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      Alert.alert('이름을 확인해주세요', '이름을 한 글자 이상 입력해주세요.');
      return;
    }
    if (isSavingProfile) return;

    try {
      if (trimmedUsername !== user?.username) await updateUsername(trimmedUsername);
      if (pendingImage) await setProfileImg(pendingImage);
      setPendingImage(null);
      setIsEditingProfile(false);
    } catch {
      Alert.alert('저장 실패', '프로필을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const refresh = async () => {
    if (!user || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([userQuery.refetch(), refreshUserData()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openInterestEditor = () => {
    setDraftInterests(interestCategories);
    setIsInterestEditorOpen(true);
  };

  const toggleInterest = (category: Category) => {
    setDraftInterests((current) => {
      const isSelected = current.some(
        (item) => item.id === category.id && item.groupId === category.groupId,
      );
      if (isSelected) {
        return current.filter(
          (item) => !(item.id === category.id && item.groupId === category.groupId),
        );
      }
      if (current.length >= MAX_PREFERENCES) {
        Alert.alert('선택 제한', `행사 보기 우선순위는 최대 ${MAX_PREFERENCES}개까지 설정할 수 있습니다.`);
        return current;
      }
      return [...current, category];
    });
  };

  const saveInterests = async () => {
    if (interestCategoriesSaving) return;
    try {
      await saveInterestPreferences(draftInterests);
      setIsInterestEditorOpen(false);
    } catch {
      Alert.alert('저장 실패', '행사 보기 우선순위를 저장하지 못했습니다.');
    }
  };

  const submitBug = async () => {
    const title = bugTitle.trim();
    const content = bugContent.trim();
    if (!title || !content) {
      Alert.alert('내용을 확인해주세요', '제목과 내용을 모두 입력해주세요.');
      return;
    }
    if (isSubmittingBugReport) return;

    try {
      await submitBugReport({ title, content });
      setBugTitle('');
      setBugContent('');
      Alert.alert('접수 완료', '버그 신고가 접수되었습니다.');
    } catch {
      Alert.alert('접수 실패', '버그 신고를 접수하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleLogout = async () => {
    if (logoutMutation.isPending) return;
    try {
      await logout();
      router.replace('/');
    } catch {
      Alert.alert('로그아웃 실패', '잠시 후 다시 시도해주세요.');
    }
  };

  const confirmAccountDeletion = () => {
    Alert.alert(
      '정말 회원탈퇴를 진행하시겠어요?',
      '계정을 삭제하면 저장된 정보는 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/');
            } catch {
              Alert.alert('회원탈퇴 실패', '잠시 후 다시 시도해주세요.');
            }
          },
        },
      ],
    );
  };

  const removeBookmark = async (event: Event) => {
    try {
      await toggleBookmark(event);
    } catch {
      Alert.alert('찜 해제 실패', '찜 목록을 변경하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  if (isAuthLoading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.centered} edges={['top', 'left', 'right']}>
          <ActivityIndicator color="#208AEF" />
          <Text style={styles.loadingText}>사용자 정보를 불러오는 중...</Text>
        </SafeAreaView>
        <MobileBottomNavigation activeTab="profile" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.guestPage} edges={['top', 'left', 'right']}>
          <View style={styles.guestCard}>
            <Text style={styles.guestTitle}>로그인이 필요해요</Text>
            <Text style={styles.guestDescription}>
              프로필과 저장한 행사 정보를 확인하려면 로그인해주세요.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>로그인 · 회원가입</Text>
            </Pressable>
          </View>
        </SafeAreaView>
        <MobileBottomNavigation activeTab="profile" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor="#208AEF" />
            }>
            <View style={styles.profileSection}>
              <View style={styles.profileRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="프로필 사진 변경"
                  disabled={!isEditingProfile || isSavingProfile}
                  onPress={pickProfileImage}
                  style={styles.avatarWrapper}>
                  <Image
                    source={profileSource}
                    style={styles.avatar}
                    resizeMode="cover"
                    onError={() => setProfileImageFailed(true)}
                  />
                  {isEditingProfile && (
                    <View style={styles.cameraBadge}>
                      <Text style={styles.cameraBadgeText}>＋</Text>
                    </View>
                  )}
                </Pressable>

                <View style={styles.identity}>
                  {isEditingProfile ? (
                    <TextInput
                      value={username}
                      onChangeText={(value) =>
                        setUsername(truncateToWeight(value, MAX_NAME_WEIGHT))
                      }
                      onSubmitEditing={saveProfile}
                      editable={!isSavingProfile}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      placeholder="이름을 입력하세요"
                      placeholderTextColor="#8F8F8F"
                      style={styles.nameInput}
                    />
                  ) : (
                    <Text style={styles.username}>{user.username}</Text>
                  )}
                  <Text numberOfLines={1} style={styles.email}>
                    {user.email}
                  </Text>
                  {isEditingProfile && (
                    <Text
                      style={[
                        styles.nameHint,
                        profileNameWeight >= MAX_NAME_WEIGHT && styles.nameHintMax,
                      ]}>
                      한글 10자 · 영어 20자 이내 ({profileNameWeight}/{MAX_NAME_WEIGHT})
                    </Text>
                  )}
                </View>

                {isEditingProfile ? (
                  <View style={styles.editActions}>
                    <Pressable onPress={cancelEditingProfile} disabled={isSavingProfile}>
                      <Text style={styles.cancelText}>취소</Text>
                    </Pressable>
                    <Pressable onPress={saveProfile} disabled={isSavingProfile}>
                      <Text style={styles.doneText}>{isSavingProfile ? '저장 중' : '완료'}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="프로필 수정"
                    hitSlop={12}
                    onPress={startEditingProfile}>
                    <Text style={styles.editText}>수정</Text>
                  </Pressable>
                )}
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={openInterestEditor}
                style={({ pressed }) => [styles.preferenceCard, pressed && styles.cardPressed]}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.star}>★</Text>
                    <Text style={styles.cardTitle}>행사 보기 우선순위</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
                {interestCategoriesLoading ? (
                  <ActivityIndicator size="small" color="#208AEF" style={styles.inlineLoader} />
                ) : interestCategories.length > 0 ? (
                  <View style={styles.chipRow}>
                    {interestCategories.map((category, index) => (
                      <View
                        key={`${category.groupId}-${category.id}`}
                        style={[
                          styles.preferenceChip,
                          category.groupId === 2
                            ? styles.organizationChip
                            : styles.categoryChip,
                        ]}>
                        <Text style={styles.preferenceChipText}>
                          {index + 1}순위: {category.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyPreference}>
                    눌러서 우선순위로 확인할 행사를 설정해보세요.
                  </Text>
                )}
              </Pressable>
            </View>

            <BookmarkWidget
              events={bookmarkedEvents}
              isLoading={bookmarksLoading}
              onShowAll={() => router.push('/bookmark')}
              onToggleBookmark={removeBookmark}
            />

            <View style={styles.section}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="내 메모 목록 전체 보기"
                onPress={() => router.push('/memos')}
                style={({ pressed }) => [styles.memoSectionHeader, pressed && styles.pressed]}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.sectionTitle}>내 메모 목록</Text>
                  <ExpoImage
                    source={require('@/assets/images/pencil.svg')}
                    style={styles.sectionIcon}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.memoChevron}>›</Text>
              </Pressable>
              {eventMemos.length === 0 ? (
                <Text style={styles.emptyText}>
                  아직 메모가 없습니다.{`\n`}관심 있는 행사에 메모를 남겨보세요!
                </Text>
              ) : (
                <View style={styles.memoPreviewGrid}>
                  {eventMemos.slice(0, 2).map((memo) => (
                    <View key={memo.id} style={styles.memoPreview}>
                      <Text numberOfLines={2} style={styles.memoPreviewContent}>
                        {memo.content}
                      </Text>
                      <Text numberOfLines={1} style={styles.memoPreviewEventTitle}>
                        {memo.eventTitle}
                      </Text>
                      <Text style={styles.memoPreviewDate}>{formatDateDotParsed(memo.createdAt)}</Text>
                      {memo.tags.length > 0 && (
                        <View style={styles.memoTagRow}>
                          {memo.tags.slice(0, 3).map((tag) => (
                            <View key={tag.id} style={styles.memoTag}>
                              <Text numberOfLines={1} style={styles.memoTagText}>
                                {tag.name}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.bugHeader}>
                <FontAwesomeFreeSolid name="bug" size={20} color="#222222" />
                <Text style={styles.bugTitle}>버그 신고</Text>
              </View>
              <Text style={styles.sectionDescription}>이용 중 발견한 문제를 알려주세요.</Text>
              <TextInput
                value={bugTitle}
                onChangeText={setBugTitle}
                editable={!isSubmittingBugReport}
                maxLength={100}
                placeholder="제목"
                placeholderTextColor="#999999"
                style={styles.reportInput}
              />
              <TextInput
                value={bugContent}
                onChangeText={setBugContent}
                editable={!isSubmittingBugReport}
                maxLength={1000}
                multiline
                textAlignVertical="top"
                placeholder="문제가 발생한 상황을 자세히 적어주세요."
                placeholderTextColor="#999999"
                style={[styles.reportInput, styles.reportTextArea]}
              />
              <Pressable
                accessibilityRole="button"
                onPress={submitBug}
                disabled={isSubmittingBugReport}
                style={({ pressed }) => [
                  styles.reportButton,
                  pressed && styles.pressed,
                  isSubmittingBugReport && styles.disabled,
                ]}>
                <Text style={styles.reportButtonText}>
                  {isSubmittingBugReport ? '접수 중' : '신고하기'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.accountSection}>
              <View style={styles.accountText}>
                <Text style={styles.accountTitle}>로그아웃</Text>
                <Text style={styles.accountDescription}>현재 계정에서 로그아웃합니다.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={handleLogout}
                disabled={logoutMutation.isPending}
                style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}>
                <Text style={styles.outlineButtonText}>
                  {logoutMutation.isPending ? '로그아웃 중' : '로그아웃'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.accountSection}>
              <View style={styles.accountText}>
                <Text style={styles.accountTitle}>회원탈퇴</Text>
                <Text style={styles.accountDescription}>
                  계정을 삭제하면 저장된 정보가 복구되지 않습니다.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={confirmAccountDeletion}
                disabled={deleteAccountMutation.isPending}
                style={({ pressed }) => [
                  styles.outlineButton,
                  styles.deleteButton,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.deleteButtonText}>
                  {deleteAccountMutation.isPending ? '처리 중' : '회원탈퇴'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <MobileBottomNavigation activeTab="profile" />

      <Modal
        visible={isInterestEditorOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsInterestEditorOpen(false)}>
        <SafeAreaView style={styles.editorSafeArea}>
          <View style={styles.editorHeader}>
            <Pressable
              onPress={() => setIsInterestEditorOpen(false)}
              disabled={interestCategoriesSaving}
              style={styles.editorHeaderAction}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Text style={styles.editorTitle}>관심사 설정</Text>
            <View style={styles.editorHeaderAction} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.editorContent}>
            <View style={styles.onboardingHeader}>
              <Text style={styles.onboardingSubtitle}>
                먼저 보고 싶은 행사의 카테고리 또는 주최기관을 선택해주세요.
              </Text>
            </View>

            <View style={styles.selectedInterests}>
              {draftInterests.length === 0 ? (
                <Text style={styles.selectedHint}>최대 3개까지, 선택한 순서대로 저장돼요.</Text>
              ) : (
                draftInterests.map((item, index) => (
                  <View key={`${item.groupId}-${item.id}`} style={styles.selectedChip}>
                    <Text style={styles.selectedRankLabel}>{index + 1}순위:</Text>
                    <Text style={styles.selectedChipText}>{item.name}</Text>
                  </View>
                ))
              )}
            </View>

            {isLoadingMeta ? (
              <View style={styles.editorLoading}>
                <ActivityIndicator color="#16B7FF" />
              </View>
            ) : metadataError ? (
              <View style={styles.editorLoading}>
                <Text style={styles.loadingText}>선택 목록을 불러오지 못했습니다.</Text>
                <Pressable onPress={refreshMetadata} style={styles.retryButton}>
                  <Text style={styles.doneText}>다시 시도</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.optionSections}>
                <InterestOptions
                  title="카테고리"
                  tone="category"
                  items={programTypes}
                  selected={draftInterests}
                  onToggle={toggleInterest}
                />
                <InterestOptions
                  title="주최기관"
                  tone="organization"
                  items={organizations}
                  selected={draftInterests}
                  onToggle={toggleInterest}
                />
              </View>
            )}

            <View style={styles.editorActions}>
              <Pressable
                accessibilityRole="button"
                onPress={saveInterests}
                disabled={interestCategoriesSaving}
                style={({ pressed }) => [
                  styles.editorSubmit,
                  pressed && styles.editorSubmitPressed,
                  interestCategoriesSaving && styles.disabled,
                ]}>
                {interestCategoriesSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.editorSubmitText}>완료</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function InterestOptions({
  title,
  tone,
  items,
  selected,
  onToggle,
}: {
  title: string;
  tone: 'category' | 'organization';
  items: Category[];
  selected: Category[];
  onToggle: (category: Category) => void;
}) {
  return (
    <View style={styles.optionSection}>
      <Text
        style={[
          styles.optionTitle,
          tone === 'category' ? styles.optionTitleCategory : styles.optionTitleOrganization,
        ]}>
        {title}
      </Text>
      <View style={styles.optionRow}>
        {items.map((item) => {
          const isSelected = selected.some(
            (value) => value.id === item.id && value.groupId === item.groupId,
          );
          return (
            <Pressable
              key={`${item.groupId}-${item.id}`}
              onPress={() => onToggle(item)}
              style={({ pressed }) => [
                styles.optionChip,
                tone === 'category' ? styles.optionChipCategory : styles.optionChipOrganization,
                isSelected && styles.optionChipSelected,
                pressed && styles.optionChipPressed,
              ]}>
              <Text style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    paddingTop: 10,
    paddingBottom: 32,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#777777', fontSize: 14 },
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
  primaryButton: {
    width: '100%',
    height: 50,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#208AEF',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  profileSection: { paddingHorizontal: 20, paddingBottom: 24 },
  profileRow: { minHeight: 100, flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  avatarWrapper: { width: 88, height: 88 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    backgroundColor: '#F3F3F3',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BEBEBE',
    backgroundColor: '#FFFFFF',
  },
  cameraBadgeText: { color: '#777777', fontSize: 19, lineHeight: 21, fontWeight: '600' },
  identity: { flex: 1, minWidth: 0, marginLeft: 16 },
  username: { color: '#111111', fontSize: 21, lineHeight: 27, fontWeight: '800' },
  email: { marginTop: 4, color: '#555555', fontSize: 14 },
  editText: { padding: 6, color: '#777777', fontSize: 14, fontWeight: '700' },
  nameInput: {
    height: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 10,
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: '#FFFFFF',
  },
  nameHint: { marginTop: 6, color: '#8F8F8F', fontSize: 10, lineHeight: 14 },
  nameHintMax: { color: '#D33B3B' },
  editActions: { marginLeft: 8, alignItems: 'flex-end', gap: 12 },
  cancelText: { color: '#777777', fontSize: 14, fontWeight: '600' },
  doneText: { color: '#208AEF', fontSize: 14, fontWeight: '800' },
  preferenceCard: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  cardPressed: { backgroundColor: '#F7F7F7' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  cardTitle: { color: '#222222', fontSize: 16, fontWeight: '700' },
  star: { color: '#828282', fontSize: 21 },
  chevron: { color: '#ABABAB', fontSize: 27, lineHeight: 27 },
  inlineLoader: { alignSelf: 'flex-start', marginTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  preferenceChip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  categoryChip: { backgroundColor: '#6FD2FF' },
  organizationChip: { backgroundColor: '#36C986' },
  preferenceChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  emptyPreference: { marginTop: 12, color: '#6A6A6A', fontSize: 13, fontWeight: '600' },
  section: {
    marginHorizontal: 20,
    paddingVertical: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDDDDD',
  },
  sectionTitle: { color: '#222222', fontSize: 18, fontWeight: '800' },
  sectionIcon: { width: 18, height: 18 },
  emptyText: { paddingVertical: 18, color: '#777777', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  memoSectionHeader: {
    marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memoChevron: { color: '#ABABAB', fontSize: 36, lineHeight: 36, fontWeight: '300' },
  memoPreviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 28,
  },
  memoPreview: { width: '47%', minWidth: 0 },
  memoPreviewContent: {
    minHeight: 126,
    color: '#222222',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
  },
  memoPreviewEventTitle: {
    marginTop: 22,
    color: '#999999',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  memoPreviewDate: { marginTop: 7, color: '#999999', fontSize: 14, lineHeight: 20 },
  memoTagRow: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  memoTag: {
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#ECECEC',
  },
  memoTagText: { color: '#707070', fontSize: 12, fontWeight: '700' },
  bugHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bugTitle: { color: '#222222', fontSize: 18, lineHeight: 25, fontWeight: '800' },
  sectionDescription: {
    marginTop: 6,
    marginBottom: 14,
    color: '#777777',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  reportInput: {
    height: 46,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    color: '#222222',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  reportTextArea: { height: 136, paddingTop: 13 },
  reportButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#4D4D4D',
  },
  reportButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  accountSection: {
    marginHorizontal: 20,
    paddingVertical: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDDDDD',
  },
  accountText: { marginBottom: 14 },
  accountTitle: { color: '#222222', fontSize: 17, fontWeight: '800' },
  accountDescription: { marginTop: 6, color: '#777777', fontSize: 13, lineHeight: 18 },
  outlineButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  outlineButtonText: { color: '#494949', fontSize: 14, fontWeight: '800' },
  deleteButton: { borderColor: '#F1B8B8' },
  deleteButtonText: { color: '#D33B3B', fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.55 },
  editorSafeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  editorHeader: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDDDDD',
  },
  editorHeaderAction: { width: 48 },
  editorTitle: { color: '#222222', fontSize: 17, fontWeight: '800' },
  editorContent: {
    flexGrow: 1,
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  onboardingHeader: { alignItems: 'center' },
  onboardingSubtitle: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  selectedInterests: {
    minHeight: 48,
    marginTop: 44,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  selectedHint: { color: '#888888', fontSize: 13, textAlign: 'center' },
  selectedChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 9,
    elevation: 4,
  },
  selectedRankLabel: { color: '#777777', fontSize: 16, fontWeight: '800' },
  selectedChipText: { color: '#222222', fontSize: 16, fontWeight: '800' },
  editorLoading: { minHeight: 200, alignItems: 'center', justifyContent: 'center', gap: 14 },
  retryButton: { paddingHorizontal: 16, paddingVertical: 10 },
  optionSections: { marginTop: 44, gap: 26 },
  optionSection: { gap: 14 },
  optionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.18 },
  optionTitleCategory: { color: '#16B7FF' },
  optionTitleOrganization: { color: '#18B56C' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  optionChipCategory: { backgroundColor: '#6FD2FF' },
  optionChipOrganization: { backgroundColor: '#36C986' },
  optionChipSelected: {
    backgroundColor: '#BDBDBD',
    shadowOpacity: 0.05,
  },
  optionChipPressed: { opacity: 0.8 },
  optionChipText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  optionChipTextSelected: { color: '#FFFFFF' },
  editorActions: { marginTop: 34, alignItems: 'center' },
  editorSubmit: {
    width: 120,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#16B7FF',
    shadowColor: '#16B7FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },
  editorSubmitPressed: { opacity: 0.9 },
  editorSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
