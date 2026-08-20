import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DownloadReportDialog from "@/components/dialogs/DownloadReportDialog";
import {
  downloadAttendanceReport,
  getAttendanceReport,
} from "@/services/attendanceService";
import { authStorage } from "@/lib/authStorage";
import { getSafeErrorMessage } from "@/lib/safeErrors";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const checkInFilters = [
  { label: "Semua", value: "" },
  { label: "Tepat Waktu", value: "tepat_waktu" },
  { label: "Terlambat", value: "terlambat" },
  { label: "Belum Presensi", value: "belum_presensi" },
  { label: "Cuti", value: "cuti" },
];
const checkOutFilters = [
  { label: "Semua", value: "" },
  { label: "Keluar", value: "presensi_keluar" },
  { label: "Lembur", value: "lembur" },
  { label: "Belum Presensi", value: "belum_presensi" },
  { label: "Cuti", value: "cuti" },
];
const locationFilters = [
  { label: "Semua", value: "" },
  { label: "Dalam Radius", value: "dalam_radius" },
  { label: "Di Luar Radius", value: "di_luar_radius" },
];
const blueBadge = "border-[#B7DFE9] bg-[#EDF9FC] text-[#1E93AB]";
const redBadge = "border-[#FFB7B7] bg-[#FFF0F0] text-[#EF2427]";
const displayStatus = {
  cuti: "Cuti",
  terlambat: "Terlambat",
  tepat_waktu: "Tepat Waktu",
  belum_presensi: "Belum Presensi",
  presensi_keluar: "Keluar",
  lembur: "Lembur",
  dalam_radius: "Dalam Radius",
  di_luar_radius: "Di Luar Radius",
};

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = String(value).split("-");
  return year && month && day
    ? `${Number(month)}/${Number(day)}/${year}`
    : String(value);
}

function readableStatus(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return (
    displayStatus[normalized] ||
    (value ? String(value).replace(/_/g, " ") : "-")
  );
}

function dateParam(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDownloadName(contentDisposition) {
  return (
    contentDisposition
      ?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[1]
      ?.replace(/['"]/g, "") || "laporan-presensi.csv"
  );
}

function StatusBadge({ children }) {
  const redStatuses = ["Terlambat", "Cuti", "Belum Presensi", "Di Luar Radius"];
  return (
    <span
      className={cn(
        "inline-flex min-w-[68px] justify-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase whitespace-nowrap",
        redStatuses.includes(children) ? redBadge : blueBadge,
      )}
    >
      {children}
    </span>
  );
}

function ColumnFilter({
  id,
  label,
  value,
  options,
  openFilter,
  onToggle,
  onChange,
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="inline-flex items-center gap-1 rounded-full px-0 text-left text-[12px] font-bold uppercase text-[#707989]"
      >
        <span>{label}</span>
        <ChevronDown size={14} className={cn(value && "text-[#EF2427]")} />
      </button>
      {openFilter === id && (
        <div className="absolute left-0 top-full z-30 mt-2 w-[180px] rounded-2xl bg-white p-1.5 text-left normal-case shadow-xl">
          {options.map((option) => (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "block w-full rounded-xl px-3 py-2 text-left text-[12px] font-medium text-slate-700",
                option.value === value &&
                  "bg-[#FDE5E5] font-semibold text-[#EF2427]",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {value && (
        <span className="sr-only">Filter aktif: {selected?.label}</span>
      )}
    </div>
  );
}

function MobileRow({ row }) {
  return (
    <article className="border-b border-slate-200 p-5 last:border-0">
      <p className="max-w-[150px] text-[13px] font-bold uppercase leading-5 text-black">
        {row.name}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 text-[11px]">
        <div>
          <p className="text-slate-500">Tanggal</p>
          <p className="mt-1 font-semibold">{row.date}</p>
        </div>
        <div>
          <p className="text-slate-500">Masuk</p>
          <p className="mt-1 font-semibold">{row.checkIn}</p>
        </div>
        <div>
          <p className="text-slate-500">Status Masuk</p>
          <div className="mt-1">
            <StatusBadge>{row.checkInStatus}</StatusBadge>
          </div>
        </div>
        <div>
          <p className="text-slate-500">Keluar</p>
          <p className="mt-1 font-semibold">{row.checkOut}</p>
        </div>
        <div>
          <p className="text-slate-500">Status Keluar</p>
          <div className="mt-1">
            <StatusBadge>{row.checkOutStatus}</StatusBadge>
          </div>
        </div>
        <div>
          <p className="text-slate-500">Status Lokasi</p>
          <div className="mt-1">
            {row.locationStatus === "-" ? (
              "-"
            ) : (
              <StatusBadge>{row.locationStatus}</StatusBadge>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AttendanceReportPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState({ column: "", value: "" });
  const [openFilter, setOpenFilter] = useState("");
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [report, setReport] = useState({ items: [], meta: {} });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      setReport(
        await getAttendanceReport({
          page,
          limit: 10,
          ...(query.trim() ? { search: query.trim() } : {}),
          ...(activeFilter.value ? { status: activeFilter.value } : {}),
        }),
      );
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        authStorage.clearSession();
        navigate(ROUTES.login, { replace: true });
        return;
      }

      setErrorMessage(getSafeErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter.value, navigate, page, query]);

  // API load populates report state after the component mounts or filters change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport();
  }, [loadReport]);

  const rows = useMemo(
    () =>
      report.items.map((item) => ({
        id: item.id,
        name: item.karyawan_nama || "-",
        date: formatDate(item.tanggal),
        checkIn: item.jam_masuk || "-",
        checkInStatus: readableStatus(item.status_masuk || item.jenis_cuti),
        checkOut: item.jam_keluar || "-",
        checkOutStatus: readableStatus(item.status_keluar || item.jenis_cuti),
        locationStatus: readableStatus(item.location_status_masuk),
      })),
    [report.items],
  );

  const updateFilter = (column, value) => {
    setActiveFilter(value ? { column, value } : { column: "", value: "" });
    setOpenFilter("");
    setPage(1);
  };

  const openDownloadDialog = () => {
    if (isDownloading) return;
    setDownloadError("");

    if (!report.items.length) {
      setDownloadError("Tidak ada data untuk diunduh.");
      return;
    }

    setDownloadOpen(true);
  };

  const exportReport = async (selection) => {
    setDownloadError("");
    setIsDownloading(true);
    const params = {};
    if (selection.period === "Harian")
      params.start_date = params.end_date = dateParam(selection.dailyDate);
    if (selection.period === "Mingguan") {
      const dates = [...selection.weeklyDates].sort((a, b) => a - b);
      params.start_date = dateParam(dates[0]);
      params.end_date = dateParam(dates.at(-1));
    }
    if (selection.period === "Bulanan") {
      const { year, month } = selection.selectedMonth;
      params.start_date = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      params.end_date = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;
    }
    if (selection.period === "Tahunan") {
      params.start_date = `${selection.selectedYear}-01-01`;
      params.end_date = `${selection.selectedYear}-12-31`;
    }

    try {
      const preview = await getAttendanceReport({
        ...params,
        page: 1,
        limit: 1,
      });
      if (!preview.items.length) {
        setDownloadError("Tidak ada data untuk diunduh.");
        return;
      }

      const { file, contentDisposition } =
        await downloadAttendanceReport(params);
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = getDownloadName(contentDisposition);
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(getSafeErrorMessage(error));
    } finally {
      setIsDownloading(false);
    }
  };

  const currentPage = report.meta?.page || page;
  const totalPages = report.meta?.total_pages || 1;

  return (
    <div className="mx-auto max-w-[1040px]">
      <header className="mb-9">
        <h2 className="text-[26px] font-bold leading-none tracking-[-.5px] text-slate-900">
          Laporan Presensi
        </h2>
        <p className="mt-2 text-[14px] text-slate-500">
          Lihat dan ekspor laporan presensi karyawan
        </p>
      </header>
      <section className="rounded-2xl bg-[#EF2427] p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="flex h-9 flex-1 items-center rounded-full bg-white px-6 sm:h-[36px]">
            <Search size={20} className="shrink-0 text-black" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="ml-4 w-full bg-transparent text-[13px] outline-none placeholder:text-slate-900"
              placeholder="Cari nama"
            />
          </label>
          <button
            type="button"
            onClick={openDownloadDialog}
            disabled={isDownloading}
            className="flex h-9 items-center justify-between rounded-full bg-white px-6 text-[13px] font-medium text-black disabled:opacity-60 lg:w-[214px]"
          >
            {isDownloading ? "Menyiapkan..." : "Unduh Laporan"}
            <ChevronDown size={18} />
          </button>
        </div>
        {downloadError && (
          <p className="mt-3 text-center text-[12px] font-medium text-white">
            {downloadError}
          </p>
        )}
      </section>
      <section className="mt-9 min-h-[430px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <h3 className="border-b border-slate-200 px-6 py-4 text-[23px] font-bold tracking-[-.5px] text-slate-900">
          Data Presensi Karyawan
        </h3>
        {errorMessage ? (
          <div className="p-10 text-center text-sm text-[#EF2427]">
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={loadReport}
              className="mt-3 font-semibold text-[#1E93AB]"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            <div className="md:hidden">
              {isLoading ? (
                <p className="p-10 text-center text-sm text-slate-500">
                  Memuat data presensi...
                </p>
              ) : rows.length ? (
                rows.map((row) => <MobileRow key={row.id} row={row} />)
              ) : (
                <p className="p-10 text-center text-sm text-slate-500">
                  Data presensi tidak ditemukan.
                </p>
              )}
            </div>
            <div className="hidden min-h-[350px] max-h-[720px] overflow-x-auto overflow-y-auto md:block">
              <table className="w-full min-w-[960px] text-left">
                <thead className="bg-[#F7F8FA] text-[12px] font-bold uppercase text-[#707989]">
                  <tr>
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-4 py-4">Tanggal</th>
                    <th className="px-4 py-4">Masuk</th>
                    <th className="px-4 py-4">
                      <ColumnFilter
                        id="checkIn"
                        label="Status Masuk"
                        value={
                          activeFilter.column === "checkIn"
                            ? activeFilter.value
                            : ""
                        }
                        options={checkInFilters}
                        openFilter={openFilter}
                        onToggle={(id) =>
                          setOpenFilter((current) => (current === id ? "" : id))
                        }
                        onChange={(value) => updateFilter("checkIn", value)}
                      />
                    </th>
                    <th className="px-4 py-4">Keluar</th>
                    <th className="px-4 py-4">
                      <ColumnFilter
                        id="checkOut"
                        label="Status Keluar"
                        value={
                          activeFilter.column === "checkOut"
                            ? activeFilter.value
                            : ""
                        }
                        options={checkOutFilters}
                        openFilter={openFilter}
                        onToggle={(id) =>
                          setOpenFilter((current) => (current === id ? "" : id))
                        }
                        onChange={(value) => updateFilter("checkOut", value)}
                      />
                    </th>
                    <th className="px-4 py-4">
                      <ColumnFilter
                        id="location"
                        label="Status Lokasi"
                        value={
                          activeFilter.column === "location"
                            ? activeFilter.value
                            : ""
                        }
                        options={locationFilters}
                        openFilter={openFilter}
                        onToggle={(id) =>
                          setOpenFilter((current) => (current === id ? "" : id))
                        }
                        onChange={(value) => updateFilter("location", value)}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-10 text-center text-sm text-slate-500"
                      >
                        Memuat data presensi...
                      </td>
                    </tr>
                  ) : rows.length ? (
                    rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-slate-200 text-[13px] text-black"
                      >
                        <td className="w-[15%] px-6 py-6 font-bold uppercase leading-5">
                          {row.name}
                        </td>
                        <td className="px-4 py-6 font-semibold whitespace-nowrap">
                          {row.date}
                        </td>
                        <td className="px-4 py-6 font-semibold whitespace-nowrap">
                          {row.checkIn}
                        </td>
                        <td className="px-4 py-6">
                          <StatusBadge>{row.checkInStatus}</StatusBadge>
                        </td>
                        <td className="px-4 py-6 font-semibold whitespace-nowrap">
                          {row.checkOut}
                        </td>
                        <td className="px-4 py-6">
                          <StatusBadge>{row.checkOutStatus}</StatusBadge>
                        </td>
                        <td className="px-4 py-6">
                          {row.locationStatus === "-" ? (
                            "-"
                          ) : (
                            <StatusBadge>{row.locationStatus}</StatusBadge>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-10 text-center text-sm text-slate-500"
                      >
                        Data presensi tidak ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 border-t border-slate-200 px-5 py-4 text-sm">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="font-semibold text-[#1E93AB] disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <span className="text-slate-500">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="font-semibold text-[#1E93AB] disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </>
        )}
      </section>
      <DownloadReportDialog
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        onDownload={exportReport}
      />
    </div>
  );
}
