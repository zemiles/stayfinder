import type { UserRole } from "../types";

const ACCESS_TOKEN_KEY = "stayfinder.accessToken";
const REFRESH_TOKEN_KEY = "stayfinder.refreshToken";
const ROLE_KEY = "stayfinder.role";
const EMAIL_KEY = "stayfinder.email";

export function saveSession(params: {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
  email: string;
}) {
  localStorage.setItem(ACCESS_TOKEN_KEY, params.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, params.refreshToken);
  localStorage.setItem(ROLE_KEY, params.role);
  localStorage.setItem(EMAIL_KEY, params.email);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredRole(): UserRole | null {
  const role = localStorage.getItem(ROLE_KEY);
  if (role === "USER" || role === "CORP_USER" || role === "ADMIN") {
    return role;
  }
  return null;
}

export function getStoredEmail() {
  return localStorage.getItem(EMAIL_KEY);
}
