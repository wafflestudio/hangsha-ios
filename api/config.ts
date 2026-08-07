const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = getApiBaseUrl(configuredApiUrl);

function getApiBaseUrl(value: string | undefined) {
  if (!value) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not configured. Pull the EAS development environment before starting Expo.",
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("EXPO_PUBLIC_API_URL must be a valid absolute URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("EXPO_PUBLIC_API_URL must use http or https.");
  }

  return value.endsWith("/") ? value : `${value}/`;
}
