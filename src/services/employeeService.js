import apiClient from "@/lib/apiClient";
import { compressEmployeeUploadImage } from "@/lib/imageCompression";

async function unwrap(request, fallbackMessage) {
  const { data } = await request;

  if (!data?.success) throw new Error(data?.message || fallbackMessage);

  return data.data;
}

export async function getEmployees(params) {
  const { data } = await apiClient.get("/api/admin/karyawan", { params });

  if (!data?.success)
    throw new Error(data?.message || "Gagal memuat data karyawan.");

  return {
    items: Array.isArray(data.data) ? data.data.filter(Boolean) : [],
    meta: data.meta && typeof data.meta === "object" ? data.meta : {},
  };
}

export const createEmployee = (payload) =>
  unwrap(
    apiClient.post("/api/admin/karyawan", payload),
    "Gagal menambah karyawan.",
  );

export const updateEmployee = (id, payload) =>
  unwrap(
    apiClient.put(`/api/admin/karyawan/${id}`, payload),
    "Gagal memperbarui karyawan.",
  );

export const deactivateEmployee = (id) =>
  unwrap(
    apiClient.delete(`/api/admin/karyawan/${id}`),
    "Gagal menonaktifkan karyawan.",
  );

async function uploadImage(endpoint, file, karyawanId, fallbackMessage, kind) {
  const uploadFile = await compressEmployeeUploadImage(file, kind);
  const formData = new FormData();
  formData.append("image", uploadFile);
  formData.append("karyawan_id", karyawanId);

  return unwrap(
    apiClient.post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
    fallbackMessage,
  );
}

export const uploadEmployeePhoto = (file, karyawanId) =>
  uploadImage(
    "/api/upload/image",
    file,
    karyawanId,
    "Gagal mengunggah foto karyawan.",
    "photo",
  );

export const uploadEmployeeSignature = (file, karyawanId) =>
  uploadImage(
    "/api/ttd/upload",
    file,
    karyawanId,
    "Gagal mengunggah TTD karyawan.",
    "signature",
  );
