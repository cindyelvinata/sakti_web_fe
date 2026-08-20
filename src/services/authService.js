import apiClient from "@/lib/apiClient";
import { authStorage } from "@/lib/authStorage";
import { safeErrorMessages } from "@/lib/safeErrors";

export async function login({ email, password }) {
  const { data } = await apiClient.post("/api/auth/login", { email, password });
  const { access_token: accessToken, user } = data?.data ?? {};

  if (!data?.success || !accessToken) {
    throw new Error(safeErrorMessages.loginFailed);
  }

  if (user?.role !== "admin") {
    authStorage.clearSession();
    throw new Error(safeErrorMessages.accessDenied);
  }

  authStorage.setSession({ accessToken, user });
  return { accessToken, user };
}
