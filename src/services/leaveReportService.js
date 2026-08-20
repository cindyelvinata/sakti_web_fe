import apiClient from "@/lib/apiClient";

export async function getLeaveReport(params) {
  const { data } = await apiClient.get("/api/admin/cuti", { params });

  if (!data?.success) throw new Error("Gagal memuat laporan cuti.");

  const report = data.data ?? {};
  return {
    items: Array.isArray(report.items) ? report.items.filter(Boolean) : [],
    meta: report.meta && typeof report.meta === "object" ? report.meta : {},
  };
}

export async function downloadLeaveReport(params) {
  const response = await apiClient.get("/api/admin/cuti/export", {
    params,
    responseType: "blob",
  });
  return {
    file: response.data,
    contentDisposition: response.headers["content-disposition"],
  };
}
