import apiClient from "@/lib/apiClient";
import { compressEmployeeUploadImage } from "@/lib/imageCompression";

async function unwrap(request, fallbackMessage) {
  const { data } = await request;
  if (!data?.success) throw new Error(data?.message || fallbackMessage);
  return data.data;
}

export const getWorkConfiguration = () =>
  unwrap(
    apiClient.get("/api/admin/konfigurasi-kerja"),
    "Gagal memuat konfigurasi kerja.",
  );
export const updateWorkConfiguration = (payload) =>
  unwrap(
    apiClient.put("/api/admin/konfigurasi-kerja", payload),
    "Gagal menyimpan konfigurasi kerja.",
  );

export async function uploadWorkConfigurationLogo(file) {
  const uploadFile = await compressEmployeeUploadImage(file, "photo");
  const formData = new FormData();
  formData.append("image", uploadFile);

  const { data } = await apiClient.post("/api/upload/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (!data?.success)
    throw new Error(data?.message || "Gagal mengunggah logo kantor.");

  const url = data.data?.url || data.url;
  if (!url) throw new Error("URL logo tidak tersedia dari response upload.");

  return url;
}

export async function getHolidays(params = { page: 1, limit: 100 }) {
  const { data } = await apiClient.get("/api/admin/libur", { params });
  if (!data?.success)
    throw new Error(data?.message || "Gagal memuat hari libur.");
  return {
    items: Array.isArray(data.data) ? data.data : [],
    meta: data.meta ?? {},
  };
}

export const createHoliday = (payload) =>
  unwrap(
    apiClient.post("/api/admin/libur", payload),
    "Gagal menambah hari libur.",
  );
export const updateHoliday = (id, payload) =>
  unwrap(
    apiClient.put(`/api/admin/libur/${id}`, payload),
    "Gagal memperbarui hari libur.",
  );
export const deleteHoliday = (id) =>
  unwrap(
    apiClient.delete(`/api/admin/libur/${id}`),
    "Gagal menghapus hari libur.",
  );
