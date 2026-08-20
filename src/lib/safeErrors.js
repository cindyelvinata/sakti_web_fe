export const safeErrorMessages = {
  accessDenied: "Anda tidak memiliki akses.",
  loginFailed: "Email atau password tidak valid.",
  requestFailed: "Terjadi kesalahan. Silakan coba lagi.",
  uploadFailed: "Upload gagal. Silakan coba lagi.",
};

export function getSafeErrorMessage(
  error,
  fallback = safeErrorMessages.requestFailed,
) {
  if ([401, 403].includes(error?.response?.status))
    return safeErrorMessages.accessDenied;
  return fallback;
}
