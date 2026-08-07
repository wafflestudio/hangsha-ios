const DEV_API_URL = 'https://hangsha-api-dev.wafflestudio.com/api/v1/';
const PROD_API_URL = 'https://hangsha-api.wafflestudio.com/api/v1/';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = ensureTrailingSlash(
  configuredApiUrl || (__DEV__ ? DEV_API_URL : PROD_API_URL),
);

function ensureTrailingSlash(url: string) {
  return url.endsWith('/') ? url : `${url}/`;
}
