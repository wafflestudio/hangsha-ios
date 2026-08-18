const configuredSnuttBaseUrl = process.env.EXPO_PUBLIC_SNUTT_BASE_URL?.trim();
const configuredTimetablePickerOrigin =
  process.env.EXPO_PUBLIC_TIMETABLE_PICKER_ORIGIN?.trim();
const fallbackSnuttBaseUrl = __DEV__
  ? 'https://snutt-dev.wafflestudio.com'
  : 'https://snutt.wafflestudio.com';

export const SNUTT_BASE_URL = getSnuttBaseUrl(configuredSnuttBaseUrl || fallbackSnuttBaseUrl);
export const SNUTT_ORIGIN = new URL(SNUTT_BASE_URL).origin;
export const TIMETABLE_PICKER_ORIGIN = getTimetablePickerOrigin(
  configuredTimetablePickerOrigin,
);

export function createSnuttTimetablePickerUrl(): string {
  const url = new URL('/timetable-picker', SNUTT_BASE_URL);

  url.searchParams.set('origin', TIMETABLE_PICKER_ORIGIN);
  return url.toString();
}

function getTimetablePickerOrigin(value: string | undefined): string {
  if (!value) {
    throw new Error(
      'EXPO_PUBLIC_TIMETABLE_PICKER_ORIGIN is not configured. Pull the EAS development environment before starting Expo.',
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('EXPO_PUBLIC_TIMETABLE_PICKER_ORIGIN must be a valid absolute URL origin.');
  }

  if (url.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_TIMETABLE_PICKER_ORIGIN must use https.');
  }

  if (
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'EXPO_PUBLIC_TIMETABLE_PICKER_ORIGIN must contain only an origin, without credentials, a path, query parameters, or a fragment.',
    );
  }

  return url.origin;
}

function getSnuttBaseUrl(value: string | undefined): string {
  if (!value) {
    throw new Error(
      'EXPO_PUBLIC_SNUTT_BASE_URL is not configured. Pull the EAS development environment before starting Expo.',
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('EXPO_PUBLIC_SNUTT_BASE_URL must be a valid absolute URL.');
  }

  if (url.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_SNUTT_BASE_URL must use https.');
  }

  return url.toString();
}
