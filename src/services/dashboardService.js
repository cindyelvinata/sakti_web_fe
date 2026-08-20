import apiClient from "@/lib/apiClient";

export async function getDashboard() {
  const { data } = await apiClient.get("/api/admin/dashboard");

  if (!data?.success) {
    throw new Error("Gagal memuat data dashboard.");
  }

  return data.data ?? null;
}
