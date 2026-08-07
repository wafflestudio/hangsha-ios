# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# api layer - context layer 분리

- 직접적인 server endpoint는 api layer (`api/`)에서 감싸고,
- screen, component 등에서는 api layer을 다시 한번 감싼 context 파일 (`context/`)에 정의된 함수 및 변수들을 사용한다.

# context 파일 작성

- server state는 TanStack Query로, server state 관련 api wrapping 함수들은 TanStack Query mutation으로 관리
- 서버 데이터와 무관한 앱 내 상태 관리는 Zustand로
