const googleIosClientId =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ||
  'missing-google-client-id.apps.googleusercontent.com';
const kakaoNativeAppKey =
  process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim() || 'missing-kakao-native-app-key';
const naverUrlScheme =
  process.env.EXPO_PUBLIC_NAVER_URL_SCHEME?.trim() || 'hangsha-naver';
const iosBundleIdentifier =
  process.env.IOS_BUNDLE_IDENTIFIER?.trim() || 'com.anonymous.hangsha-ios';

module.exports = {
  expo: {
    name: 'hangsha',
    slug: 'hangsha-ios',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'hangsha',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: iosBundleIdentifier,
      icon: './assets/expo.icon',
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#208AEF',
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      ],
      'expo-secure-store',
      'expo-web-browser',
      'expo-image',
      'expo-status-bar',
      [
        'expo-build-properties',
        {
          android: {
            extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'],
          },
        },
      ],
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: getGoogleUrlScheme(googleIosClientId),
        },
      ],
      [
        '@react-native-kakao/core',
        {
          nativeAppKey: kakaoNativeAppKey,
          android: {},
          ios: {
            handleKakaoOpenUrl: true,
          },
        },
      ],
      [
        '@react-native-seoul/naver-login',
        {
          urlScheme: naverUrlScheme,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};

function getGoogleUrlScheme(clientId) {
  const suffix = '.apps.googleusercontent.com';
  const identifier = clientId.endsWith(suffix) ? clientId.slice(0, -suffix.length) : clientId;
  return `com.googleusercontent.apps.${identifier}`;
}
