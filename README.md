# hangsha-ios

행샤(Haengsha) 서울대 캠퍼스 행사 캘린더 앱의 iOS(Expo) 버전입니다. 기존 웹 서비스([hangsha-web](../hangsha-web))를 Expo + Expo Router 기반으로 마이그레이션합니다.

## 기술 스택

- Framework: Expo (React Native)
- Routing: Expo Router (file-based routing)
- Calendar: react-native-calendars
- Date: date-fns
- Language: TypeScript

## 시작하기

```bash
npm install
npx expo start
```

시뮬레이터, Expo Go, 개발 빌드 중 원하는 방식으로 실행할 수 있습니다.

## 폴더 구조

```
hangsha-ios/
├── app/            # Expo Router 라우트 정의만 (얇게 유지)
│   └── calendar.tsx    # 예: screens/CalendarScreen.tsx를 import해서 export만 함
├── screens/        # 화면 단위 로직/UI (RN 관례, app/에서 참조)
├── components/     # 재사용 가능한 UI 컴포넌트
├── api/            # 서버 통신 로직 (웹 레포와 동일한 이름 유지, 추후 이식 예정)
├── contexts/       # React Context / 전역 상태 (웹 레포와 동일한 이름 유지)
├── util/           # 날짜(date-fns) 등 유틸 함수, 테마 상수
├── hooks/          # 커스텀 훅
└── assets/         # 이미지, 폰트 등 정적 리소스
```

### 폴더별 역할

| 폴더 | 역할 |
| --- | --- |
| `app/` | Expo Router 라우트 정의만 담당. 실제 로직 없이 `screens/`의 컴포넌트를 import해서 export만 하는 패턴을 따릅니다. |
| `screens/` | 화면 단위의 실제 로직과 UI. React Native 관례에 따라 신규로 구성했습니다. |
| `components/` | 여러 화면에서 재사용하는 UI 컴포넌트. |
| `api/` | 서버 API 호출 로직. `hangsha-web`의 `src/api` 구조/이름을 그대로 유지해 웹 코드 이식을 쉽게 합니다. |
| `contexts/` | 전역 상태 관리용 Context. `hangsha-web`의 `src/contexts`와 이름을 맞췄습니다. |
| `util/` | `date-fns` 기반 날짜 유틸, 테마 상수 등. `hangsha-web`의 `src/util`과 이름을 맞췄습니다. |
| `hooks/` | Expo 템플릿 기본 훅(`use-color-scheme` 등) 및 향후 커스텀 훅. |

## Path Alias

`tsconfig.json`에서 `@/*`는 프로젝트 루트를 가리킵니다.

```ts
import { CalendarScreen } from '@/screens/CalendarScreen';
import { ThemedText } from '@/components/themed-text';
```

## 참고

- `AGENTS.md`: Expo 버전이 최근 변경되어, 코드 작성 전 [Expo v57 공식 문서](https://docs.expo.dev/versions/v57.0.0/)를 참고하라는 안내가 있습니다. AI 코딩 도구 사용 시 참고하세요.
- CI 설정은 아직 진행하지 않았습니다 (별도 작업 예정).
