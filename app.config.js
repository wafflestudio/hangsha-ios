const configuredAppVariant = process.env.APP_VARIANT?.trim();
const appVariant = configuredAppVariant || "development";
// APP_VARIANT is supplied by eas.json only while resolving an actual build profile.
// EAS management commands can therefore resolve the project with safe placeholders.
const isEasBuildConfig = Boolean(configuredAppVariant);
const isDevelopment = appVariant === "development";

if (appVariant !== "development" && appVariant !== "production") {
  throw new Error(
    `APP_VARIANT must be either "development" or "production", received "${appVariant}".`,
  );
}

const googleIosClientId = readBuildEnv(
  "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID",
  "000000000000-placeholder.apps.googleusercontent.com",
);
const iosBundleIdentifier = readBuildEnv(
  "IOS_BUNDLE_IDENTIFIER",
  "com.wafflestudio.hangsha-ios.dev",
);

module.exports = {
  expo: {
    name: isDevelopment ? "행샤 dev" : "행샤",
    slug: "hangsha-ios",
    scheme: isDevelopment ? "hangsha-dev" : "hangsha",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo.png",
    userInterfaceStyle: "automatic",

    updates: {
      url: "https://u.expo.dev/1b6d9447-08ed-4cfc-913c-dd10ff45ce21",
    },

    runtimeVersion: {
      policy: "appVersion",
    },

    ios: {
      bundleIdentifier: iosBundleIdentifier,
      icon: "./assets/images/logo.png",
      config: {
        usesNonExemptEncryption: false,
      },
    },

    android: {
      predictiveBackGestureEnabled: false,
    },

    web: {
      output: "static",
      favicon: "./assets/images/logo.png",
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#FFFFFF",
          image: "./assets/images/logo.png",
          imageWidth: 100,
          resizeMode: "contain",
        },
      ],
      "expo-secure-store",
      "expo-web-browser",
      "expo-image",
      [
        "expo-image-picker",
        {
          photosPermission:
            "프로필 사진을 선택하기 위해 사진 보관함에 접근합니다.",
        },
      ],
      "expo-status-bar",
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: getGoogleUrlScheme(googleIosClientId),
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      eas: {
        projectId: "1b6d9447-08ed-4cfc-913c-dd10ff45ce21",
      },
    },
  },
};

function getGoogleUrlScheme(clientId) {
  const suffix = ".apps.googleusercontent.com";
  if (!clientId.endsWith(suffix) || clientId === suffix) {
    throw new Error(
      "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID must be a Google iOS client ID ending in .apps.googleusercontent.com.",
    );
  }

  const identifier = clientId.slice(0, -suffix.length);
  return `com.googleusercontent.apps.${identifier}`;
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set before building the app.`);
  }
  return value;
}

function readBuildEnv(name, fallback) {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (isEasBuildConfig) return requireEnv(name);
  return fallback;
}
