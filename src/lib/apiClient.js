import axios from "axios";
import { authStorage } from "@/lib/authStorage";

const baseURL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

const accountInactiveCode = "ACCOUNT_INACTIVE";
const accountInactiveFallback =
  "Akun Anda sudah tidak aktif. Silakan hubungi administrator.";
let accountInactiveHandled = false;

function isAdminRequest(url = "") {
  return url.startsWith("/api/admin/");
}

function isAccountInactiveError(error) {
  return (
    error.response?.status === 403 &&
    error.response?.data?.code === accountInactiveCode
  );
}

function accountInactiveMessage(error) {
  const message = error.response?.data?.message;
  return typeof message === "string" && message.trim()
    ? message
    : accountInactiveFallback;
}

apiClient.interceptors.request.use((config) => {
  if (config.url === "/api/auth/login") accountInactiveHandled = false;

  const accessToken = authStorage.getAccessToken();

  if (isAdminRequest(config.url) && !accessToken) {
    const error = new Error("Admin session is not available.");
    error.isAuthGuardError = true;
    error.response = { status: 401 };
    return Promise.reject(error);
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAccountInactiveError(error)) {
      error.isAccountInactiveError = true;

      if (!accountInactiveHandled) {
        accountInactiveHandled = true;
        authStorage.setLoginMessage(accountInactiveMessage(error));
        authStorage.clearSession();
        window.dispatchEvent(new Event("admin-auth:account-inactive"));
      }

      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !error.isAuthGuardError) {
      authStorage.clearSession();
      window.dispatchEvent(new Event("admin-auth:unauthorized"));
    }

    return Promise.reject(error);
  },
);

export default apiClient;
