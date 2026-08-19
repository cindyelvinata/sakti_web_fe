import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const periods = ["Harian", "Mingguan", "Bulanan", "Tahunan"];
const weekdays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const shortMonthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function sameDay(first, second) {
  return first?.toDateString() === second?.toDateString();
}

function formatDate(date) {
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function formatWeek(dates) {
  const sorted = [...dates].sort((first, second) => first - second);
  if (sorted.length === 1) return formatDate(sorted[0]);
  const sameMonth = sorted.every(
    (date) =>
      date.getMonth() === sorted[0].getMonth() &&
      date.getFullYear() === sorted[0].getFullYear(),
  );
  if (sameMonth) {
    const ranges = [];
    sorted.forEach((date) => {
      const day = date.getDate();
      const lastRange = ranges.at(-1);
      if (lastRange && day === lastRange.end + 1) lastRange.end = day;
      else ranges.push({ start: day, end: day });
    });
    const days = ranges
      .map(({ start, end }) => (start === end ? start : `${start} – ${end}`))
      .join(", ");
    return `${days} ${monthNames[sorted[0].getMonth()]} ${sorted[0].getFullYear()}`;
  }
  return sorted.map(formatDate).join(", ");
}

function CalendarPicker({
  month,
  onMonthChange,
  selectedDates,
  onSelect,
  weekly,
}) {
  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      month.getFullYear(),
      month.getMonth(),
      1,
    ).getDay();
    const lastDate = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    return Array.from({ length: firstDay + lastDate }, (_, index) =>
      index < firstDay
        ? null
        : new Date(month.getFullYear(), month.getMonth(), index - firstDay + 1),
    );
  }, [month]);

  return (
    <>
      <div className="mt-3 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() =>
            onMonthChange(
              (current) =>
                new Date(current.getFullYear(), current.getMonth() - 1, 1),
            )
          }
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft size={15} />
        </button>
        <p className="text-[13px] font-semibold text-slate-900">
          {monthNames[month.getMonth()]} {month.getFullYear()}
        </p>
        <button
          type="button"
          onClick={() =>
            onMonthChange(
              (current) =>
                new Date(current.getFullYear(), current.getMonth() + 1, 1),
            )
          }
          aria-label="Bulan berikutnya"
        >
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 text-center">
        {weekdays.map((day) => (
          <span
            key={day}
            className="py-1 text-[10px] font-semibold text-slate-400"
          >
            {day}
          </span>
        ))}
        {calendarDays.map((day, index) => {
          if (!day) return <span key={`blank-${index}`} />;
          const selected = selectedDates.some((date) => sameDay(date, day));
          const disabled = weekly && !selected && selectedDates.length >= 7;
          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day)}
              className={cn(
                "mx-auto my-0.5 grid size-8 place-items-center rounded-xl text-[11px] font-medium",
                selected && "bg-[#FDE5E5] font-bold text-[#EF2427]",
                disabled && "cursor-not-allowed text-slate-300",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function DownloadReportDialog({ open, onClose, onDownload }) {
  const [period, setPeriod] = useState("Harian");
  const [month, setMonth] = useState(new Date(2026, 7, 1));
  const [dailyDate, setDailyDate] = useState(null);
  const [weeklyDates, setWeeklyDates] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [yearRangeStart, setYearRangeStart] = useState(2020);
  const [selectedYear, setSelectedYear] = useState(null);

  const resetForPeriod = (nextPeriod) => {
    setPeriod(nextPeriod);
    setDailyDate(null);
    setWeeklyDates([]);
    setSelectedMonth(null);
    setSelectedYear(null);
  };

  const selectDaily = (date) => setDailyDate(date);
  const selectWeekly = (date) =>
    setWeeklyDates((current) =>
      current.some((item) => sameDay(item, date))
        ? current.filter((item) => !sameDay(item, date))
        : current.length < 7
          ? [...current, date]
          : current,
    );
  const selectMonth = (monthIndex) =>
    setSelectedMonth((current) =>
      current?.year === month.getFullYear() && current.month === monthIndex
        ? null
        : { year: month.getFullYear(), month: monthIndex },
    );
  const selectYear = (year) =>
    setSelectedYear((current) => (current === year ? null : year));

  const selectionText =
    period === "Harian" && dailyDate
      ? formatDate(dailyDate)
      : period === "Mingguan" && weeklyDates.length
        ? formatWeek(weeklyDates)
        : period === "Bulanan" && selectedMonth
          ? `${monthNames[selectedMonth.month]} ${selectedMonth.year}`
          : period === "Tahunan" && selectedYear
            ? String(selectedYear)
            : null;
  const hasSelection = Boolean(selectionText);
  const years = Array.from(
    { length: 12 },
    (_, index) => yearRangeStart + index,
  );
  const title =
    period === "Harian"
      ? "Pilih Hari"
      : period === "Mingguan"
        ? "Pilih Minggu"
        : period === "Bulanan"
          ? "Pilih Bulan"
          : "Pilih Tahun";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-report-title"
        className="w-full max-w-[320px] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2
            id="download-report-title"
            className="text-[20px] font-bold text-slate-900"
          >
            Unduh Laporan
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg border border-slate-300 text-slate-400 hover:bg-slate-50"
            aria-label="Tutup popup unduh"
          >
            <X size={20} />
          </button>
        </header>
        <div className="p-4">
          <p className="text-[12px] font-semibold uppercase text-slate-500">
            Periode
          </p>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {periods.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => resetForPeriod(item)}
                className={cn(
                  "h-8 rounded-xl px-1 text-[10px] font-bold transition",
                  period === item
                    ? "bg-[#EF2427] text-white"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[12px] font-semibold uppercase text-slate-500">
            {title}
          </p>
          {(period === "Harian" || period === "Mingguan") && (
            <CalendarPicker
              month={month}
              onMonthChange={setMonth}
              selectedDates={
                period === "Harian"
                  ? dailyDate
                    ? [dailyDate]
                    : []
                  : weeklyDates
              }
              onSelect={period === "Harian" ? selectDaily : selectWeekly}
              weekly={period === "Mingguan"}
            />
          )}
          {period === "Bulanan" && (
            <>
              <div className="mt-3 flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() =>
                    setMonth(
                      (current) =>
                        new Date(
                          current.getFullYear() - 1,
                          current.getMonth(),
                          1,
                        ),
                    )
                  }
                  aria-label="Tahun sebelumnya"
                >
                  <ChevronLeft size={15} />
                </button>
                <p className="text-[13px] font-semibold text-slate-900">
                  {month.getFullYear()}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setMonth(
                      (current) =>
                        new Date(
                          current.getFullYear() + 1,
                          current.getMonth(),
                          1,
                        ),
                    )
                  }
                  aria-label="Tahun berikutnya"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-y-2">
                {shortMonthNames.map((name, index) => {
                  const selected =
                    selectedMonth?.year === month.getFullYear() &&
                    selectedMonth.month === index;
                  const disabled =
                    selectedMonth?.year === month.getFullYear() && !selected;
                  return (
                    <button
                      key={name}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectMonth(index)}
                      className={cn(
                        "mx-auto grid h-9 w-[62px] place-items-center rounded-lg text-[12px] font-medium",
                        selected && "bg-[#EF2427] font-bold text-white",
                        disabled && "cursor-not-allowed text-slate-300",
                      )}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {period === "Tahunan" && (
            <>
              <div className="mt-3 flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => setYearRangeStart((current) => current - 12)}
                  aria-label="Rentang tahun sebelumnya"
                >
                  <ChevronLeft size={15} />
                </button>
                <p className="text-[13px] font-semibold text-slate-900">
                  {yearRangeStart}–{yearRangeStart + 11}
                </p>
                <button
                  type="button"
                  onClick={() => setYearRangeStart((current) => current + 12)}
                  aria-label="Rentang tahun berikutnya"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-y-1">
                {years.map((year) => {
                  const selected = selectedYear === year;
                  const disabled =
                    selectedYear !== null &&
                    selectedYear >= yearRangeStart &&
                    selectedYear <= yearRangeStart + 11 &&
                    !selected;
                  return (
                    <button
                      key={year}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectYear(year)}
                      className={cn(
                        "mx-auto grid h-9 w-[68px] place-items-center rounded-lg text-[12px] font-medium",
                        selected && "bg-[#EF2427] font-bold text-white",
                        disabled && "cursor-not-allowed text-slate-300",
                      )}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {selectionText && (
            <div className="mt-3 rounded-lg border border-[#FFB1B1] bg-[#FDE8E8] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase text-slate-500">
                Periode Dipilih
              </p>
              <p className="mt-1 text-[12px] font-bold text-[#EF2427]">
                {selectionText}
              </p>
            </div>
          )}
          <button
            type="button"
            disabled={!hasSelection}
            onClick={() => {
              onDownload?.({
                period,
                dailyDate,
                weeklyDates,
                selectedMonth,
                selectedYear,
              });
              onClose();
            }}
            className="mt-5 h-10 w-full rounded-lg bg-[#EF2427] text-[12px] font-bold text-white hover:bg-[#d91c1f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            Unduh
          </button>
        </div>
      </section>
    </div>
  );
}
