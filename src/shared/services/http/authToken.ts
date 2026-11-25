let authToken: string | null = null;

export function setAuthToken(value: string | null): void {
  authToken = value?.trim() || null;
}

export function getAuthToken(): string | null {
  return authToken;
}
