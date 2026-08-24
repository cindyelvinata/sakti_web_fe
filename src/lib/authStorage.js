const ACCESS_TOKEN_KEY = "admin_access_token";
const USER_KEY = "admin_user";
const SESSION_EVENT = "admin-auth:session-changed";

function notifySessionChanged() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function subscribeSessionChanged(callback) {
  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function sanitizeUser(user) {
  if (!user || typeof user !== "object") return null;

  const allowedFields = [
    "id",
    "karyawan_id",
    "email",
    "nama_lengkap",
    "name",
    "role",
    "nomor_telepon",
    "level_jabatan",
    "divisi",
    "unit",
    "foto_url",
    "status_karyawan",
    "atasan_langsung_id",
  ];

  return allowedFields.reduce((result, field) => {
    if (user[field] !== undefined && user[field] !== null)
      result[field] = user[field];
    return result;
  }, {});
}

export const authStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),

  getUser: () => {
    const storedUser = localStorage.getItem(USER_KEY);

    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  setSession: ({ accessToken, user }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

    const safeUser = sanitizeUser(user);

    if (safeUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }

    notifySessionChanged();
  },

  clearSession: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    notifySessionChanged();
  },

  hasAdminSession: () =>
    Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)) &&
    authStorage.getUser()?.role === "admin",

  subscribe: subscribeSessionChanged,
};
