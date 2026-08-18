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
cp .env.example .env.local
npx expo run:ios   # 최초 1회, 또는 네이티브 의존성이 바뀔 때마다
npx expo start      # 이후엔 이것만 — 이미 설치된 Dev Client가 자동으로 붙습니다
```

⚠️ **Expo Go로는 실행할 수 없습니다.** `react-native-reanimated`/`react-native-worklets`가 Expo Go(사전 빌드된 범용 앱)에 내장된 네이티브 모듈 버전과 맞지 않아 앱 시작 직후 세그폴트로 크래시합니다. 반드시 위처럼 **Dev Client**(`npx expo run:ios`로 이 프로젝트 전용으로 빌드한 앱)로 실행하세요. `npm run ios`(`expo start --ios`)는 기본적으로 Expo Go를 여는 명령이라 마찬가지로 크래시가 나니 피하세요.

최초 `expo run:ios`는 CocoaPods 설치 + Xcode 네이티브 컴파일이 포함되어 5~10분 정도 걸립니다. 실행하려면 Xcode(Command Line Tools만으로는 부족, 전체 앱 필요)가 설치되어 있어야 하고 `xcode-select -p`가 `/Applications/Xcode.app/Contents/Developer`를 가리켜야 합니다.

`.env.local`에 아래 필수 앱 설정을 입력해야 합니다.
구글 로그인은 네이티브 SDK가 포함된 개발 빌드 또는 배포 빌드에서 확인합니다. Expo Go에서는 동작하지 않습니다.

| 환경변수                           | 설명                                                       |
| ---------------------------------- | ---------------------------------------------------------- |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google iOS OAuth Client ID                                  |
| `EXPO_PUBLIC_API_URL`              | 절대 경로 형식의 API base URL                              |
| `EXPO_PUBLIC_SNUTT_BASE_URL`       | 환경별 SNUTT base URL (`https://snutt-dev.wafflestudio.com` 또는 `https://snutt.wafflestudio.com`) |
| `EXPO_PUBLIC_TIMETABLE_PICKER_ORIGIN` | SNUTT picker에 전달할 행샤 origin (`https://hangsha-dev.wafflestudio.com` 또는 `https://hangsha.wafflestudio.com`) |

`EXPO_PUBLIC_*` 값은 앱 번들에 포함됩니다. Google이 발급한 사용자 access token은 로그인 요청에만 사용하며 로컬에 저장하지 않습니다.
`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`가 비어 있거나 Google iOS client ID 형식이 아니면 잘못된 네이티브 빌드가 만들어지지 않도록 Expo 설정 단계에서 실패합니다.

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

| 폴더          | 역할                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `app/`        | Expo Router 라우트 정의만 담당. 실제 로직 없이 `screens/`의 컴포넌트를 import해서 export만 하는 패턴을 따릅니다. |
| `screens/`    | 화면 단위의 실제 로직과 UI. React Native 관례에 따라 신규로 구성했습니다.                                        |
| `components/` | 여러 화면에서 재사용하는 UI 컴포넌트.                                                                            |
| `api/`        | 서버 API 호출 로직. `hangsha-web`의 `src/api` 구조/이름을 그대로 유지해 웹 코드 이식을 쉽게 합니다.              |
| `contexts/`   | 전역 상태 관리용 Context. `hangsha-web`의 `src/contexts`와 이름을 맞췄습니다.                                    |
| `util/`       | `date-fns` 기반 날짜 유틸, 테마 상수 등. `hangsha-web`의 `src/util`과 이름을 맞췄습니다.                         |
| `hooks/`      | Expo 템플릿 기본 훅(`use-color-scheme` 등) 및 향후 커스텀 훅.                                                    |

## Path Alias

`tsconfig.json`에서 `@/*`는 프로젝트 루트를 가리킵니다.

```ts
import { CalendarScreen } from "@/screens/CalendarScreen";
import { ThemedText } from "@/components/themed-text";
```

## 참고

- `AGENTS.md`: Expo 버전이 최근 변경되어, 코드 작성 전 [Expo v57 공식 문서](https://docs.expo.dev/versions/v57.0.0/)를 참고하라는 안내가 있습니다. AI 코딩 도구 사용 시 참고하세요.
- CI 설정은 아직 진행하지 않았습니다 (별도 작업 예정).

## Environment & EAS

환경변수는 `.env.development`, `.env.production` 대신 **EAS Environment Variables**를 source of truth로 사용합니다.

사용 환경:

- `development`
- `production`

로컬에서는 EAS 값을 `.env.local`로 pull해서 사용합니다.

### 로그인

```bash
npx eas-cli@latest login
npx eas-cli@latest whoami
```

### 환경변수 가져오기

개발 환경:

```bash
npx eas-cli@latest env:pull --environment development
```

운영 환경:

```bash
npx eas-cli@latest env:pull --environment production
```

`.env.local`은 Git에 커밋하지 않습니다.

```gitignore
.env.local
```

일반적인 로컬 개발에서는 항상 `development` 환경을 사용합니다.

### 환경변수 확인

```bash
npx eas-cli@latest env:list --environment development
npx eas-cli@latest env:list --environment production
```

EAS의 `development`, `production` 환경에 각각 필요한 변수:

```env
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SNUTT_BASE_URL=
EXPO_PUBLIC_TIMETABLE_PICKER_ORIGIN=
```

`EXPO_PUBLIC_*` 값은 앱 번들에 포함되므로 secret을 저장하지 않습니다. EAS visibility는 `Plain text` 또는 `Sensitive`로 설정합니다.

picker URL의 `origin` 값에는 `EXPO_PUBLIC_TIMETABLE_PICKER_ORIGIN`을 사용합니다. 개발 환경은 `https://hangsha-dev.wafflestudio.com`, 운영 환경은 `https://hangsha.wafflestudio.com`이며 SNUTT의 `VITE_TIMETABLE_PICKER_ORIGINS` 허용 목록과 일치해야 합니다. WebView에서 수신한 메시지는 이 값과 별개로 `EXPO_PUBLIC_SNUTT_BASE_URL`의 origin을 기준으로 검증합니다.

`APP_VARIANT`는 원격 EAS 변수가 아니라 `eas.json`의 build profile에서 고정합니다. 이 값은 앱 이름, URL scheme, iOS Bundle Identifier를 아래처럼 선택하고 실제 EAS Build에서 필수 환경변수 검증을 활성화합니다.

| profile       | 앱 이름    | iOS Bundle Identifier                    | channel       |
| ------------- | ---------- | ---------------------------------------- | ------------- |
| `development` | `행샤 dev` | `com.wafflestudio.hangsha-ios.dev`       | `development` |
| `production`  | `행샤`     | `com.wafflestudio.hangsha-ios`           | `production`  |

---

## EAS Build

`eas.json`에서 Build Profile과 EAS Environment를 연결합니다.

```json
{
  "cli": {
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "environment": "development",
      "channel": "development",
      "env": {
        "APP_VARIANT": "development"
      }
    },
    "production": {
      "distribution": "store",
      "environment": "production",
      "channel": "production",
      "autoIncrement": true,
      "env": {
        "APP_VARIANT": "production"
      }
    }
  }
}
```

### Development Build

```bash
npx eas-cli@latest build --profile development --platform ios
```

설치 후 Metro 실행:

```bash
npx expo start --dev-client
```

다음 변경이 있을 경우 Development Build를 다시 생성해야 합니다.

- 네이티브 라이브러리 추가/제거
- Expo Config Plugin 변경
- Bundle Identifier 변경
- URL Scheme 변경
- iOS native 설정 변경

JS/TS 코드만 변경된 경우에는 일반적으로 재빌드가 필요하지 않습니다.

### Production Build

```bash
npx eas-cli@latest build --profile production --platform ios
```

최근 Build 확인:

```bash
npx eas-cli@latest build:list --platform ios
```

---

## App Store / TestFlight 배포

가장 최근 Production Build 제출:

```bash
npx eas-cli@latest submit --platform ios --latest
```

Build와 제출을 한 번에 실행:

```bash
npx eas-cli@latest build \
  --profile production \
  --platform ios \
  --auto-submit
```

---

## 권장 Workflow

로컬 개발:

```bash
npx eas-cli@latest env:pull --environment development
npx expo start --dev-client
```

네이티브 설정 변경 후:

```bash
npx eas-cli@latest build --profile development --platform ios
```

운영 배포:

```bash
npx eas-cli@latest env:list --environment production
npx eas-cli@latest build --profile production --platform ios
npx eas-cli@latest submit --platform ios --latest
```

> EAS Environment가 환경변수의 원본이며, `.env.local`은 로컬 개발용 복사본으로만 사용합니다.

---

## GitHub Actions CI/CD

GitHub Actions는 환경별 진입점과 공통 실행 로직으로 분리되어 있습니다.

- `.github/workflows/deploy_dev.yml`: `dev` 브랜치 이벤트
- `.github/workflows/deploy_prod.yml`: `main` 브랜치 이벤트
- `.github/workflows/_deploy.yml`: 설치, 검사, EAS Build/Submit 공통 로직

| GitHub 이벤트                | 실행 내용                                                     |
| ---------------------------- | ------------------------------------------------------------- |
| `dev`, `main` 대상 PR        | `npm ci`, ESLint, TypeScript 검사                              |
| `dev` push                   | 검사 후 development profile iOS 내부 배포 빌드를 EAS에 요청   |
| `main` push                  | 검사 후 production profile iOS 빌드 및 TestFlight 제출을 요청 |
| `Deploy development` 수동 실행 | development profile의 동일한 배포 흐름 실행                  |
| `Deploy production` 수동 실행  | production profile 빌드 및 TestFlight 제출                   |

GitHub repository secret에 Expo personal access token을 등록합니다.

```text
EXPO_TOKEN
```

EAS 원격 빌드는 GitHub secret이 아니라 위에서 설명한 EAS Environment Variables를 사용합니다.

CI를 처음 실행하기 전 각 profile을 로컬에서 한 번 빌드해 iOS 인증서와 provisioning profile을 생성해야 합니다. 이미 TestFlight/App Store 빌드가 있다면 `eas build:version:set`으로 마지막 iOS build number를 EAS 원격 버전에 먼저 동기화합니다. production 자동 제출을 위해 `eas credentials --platform ios`에서 App Store Connect API Key도 설정합니다. `main`의 자동 제출 대상은 TestFlight이며, App Store 심사 제출과 출시는 App Store Connect에서 수동으로 진행합니다.
