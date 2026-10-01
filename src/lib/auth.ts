export const AUTH_TOKEN_KEY = "fizzi-auth-token";
export const AUTH_USER_KEY = "fizzi-user";

export type FizziUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

export function getStoredUser(): FizziUser | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  const rawUser = window.localStorage.getItem(AUTH_USER_KEY);
  if (!token || !rawUser) return null;
  try {
    return JSON.parse(rawUser) as FizziUser;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(token: string, user: FizziUser) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("fizzi-auth-change"));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new Event("fizzi-auth-change"));
}
