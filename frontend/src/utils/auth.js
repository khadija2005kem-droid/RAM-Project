export const AUTH_KEYS = {
  token: "token",
  legacyToken: "auth_token",
  user: "user",
  role: "role",
};

const STORAGE_KEYS = [
  AUTH_KEYS.token,
  AUTH_KEYS.legacyToken,
  AUTH_KEYS.user,
  AUTH_KEYS.role,
  "access_token",
];

const readFromStorage = (key) =>
  localStorage.getItem(key) || sessionStorage.getItem(key);

const removeFromStorage = (key) => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

export function normalizeRole(rawRole) {
  const value = String(rawRole || "").toLowerCase().trim();
  if (value.includes("admin")) return "admin";
  if (value.includes("client")) return "client";
  return "";
}

export function getAuthToken() {
  return readFromStorage(AUTH_KEYS.token) || readFromStorage(AUTH_KEYS.legacyToken);
}

export function getStoredUser() {
  const rawUser = readFromStorage(AUTH_KEYS.user);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

export function setAuthSession({ token, user }) {
  if (token) {
    localStorage.setItem(AUTH_KEYS.token, token);
    localStorage.setItem(AUTH_KEYS.legacyToken, token);
    removeFromStorage("access_token");
  }

  if (user) {
    localStorage.setItem(AUTH_KEYS.user, JSON.stringify(user));
    const normalizedRole = normalizeRole(user.role);
    if (normalizedRole) {
      localStorage.setItem(AUTH_KEYS.role, normalizedRole);
    } else {
      removeFromStorage(AUTH_KEYS.role);
    }
  } else {
    removeFromStorage(AUTH_KEYS.user);
    removeFromStorage(AUTH_KEYS.role);
  }
}

export function clearAuthSession() {
  STORAGE_KEYS.forEach(removeFromStorage);
}
