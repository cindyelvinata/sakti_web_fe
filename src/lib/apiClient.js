import axios from "axios";
import { authStorage } from "@/lib/authStorage";

const baseURL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = authStorage.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStorage.clearSession();
      window.dispatchEvent(new Event("admin-auth:unauthorized"));
    }

    return Promise.reject(error);
  },
);

export default apiClient;
