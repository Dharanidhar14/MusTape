type ApiErrorBody = {
  error?: string;
  message?: string;
};

export function apiUnavailableMessage(apiBaseUrl: string) {
  return `MusTape could not reach the API at ${apiBaseUrl}. Start the backend or check NEXT_PUBLIC_API_URL.`;
}

export function userFacingApiError(body: ApiErrorBody | null, fallback: string) {
  return body?.error || body?.message || fallback;
}
