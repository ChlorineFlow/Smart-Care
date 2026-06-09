import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}
const pad = (n) => String(n).padStart(2, "0");



function displayDate(dateStr) {
  // Parse as local date to avoid UTC shift
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function displayDateShort(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DoctorAvailability() {
  const { user } = useAuth();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [blocked, setBlocked] = useState([]);
  const [selected, setSelected] = useState(new Set()); // multi-select
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

const load = async () => {
  try {
    const data = await api.getBlockedDates(user.id);
    setBlocked(data);
    return data;
  } catch {}
  return [];
};

  useEffect(() => {
    if (user) load();
  }, [user]);

  const isBlocked = (dateStr) => blocked.some((b) => b.blockedDate === dateStr);
  const isSelected = (dateStr) => selected.has(dateStr);

  const handleDayClick = (dateStr) => {
    if (dateStr < todayStr) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };

const handleBlockSelected = async () => {
  if (selected.size === 0) return;
  setLoading(true);
  let totalCancelled = 0;
  let successCount = 0;
  try {
    for (const dateStr of selected) {
      try {
        const res = await api.blockDate(user.id, dateStr, reason);
        totalCancelled += res?.cancelledAppointments || 0;
        successCount++;
      } catch (e) {
        console.error("Block failed for", dateStr, e.message);
      }
    }
    await load();
    setSelected(new Set());
    setReason("");
    const msg = totalCancelled > 0
      ? `${successCount} date(s) blocked. ${totalCancelled} appointment(s) cancelled & patients notified.`
      : `${successCount} date(s) blocked successfully.`;
    showToast(msg);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
};

const handleUnblock = async (dateStr) => {
  try {
    await api.unblockDate(user.id, dateStr);
    setSelected(new Set());
    await load(); // reload fresh from server
    showToast("Date unblocked — you are available again.");
  } catch (err) {
    showToast(err.message, "error");
    await load();
  }
};

const handleUnblockSelected = async () => {
  setLoading(true);
  try {
    const toUnblock = [...selected].filter(d => isBlocked(d));
    for (const dateStr of toUnblock) {
      await api.unblockDate(user.id, dateStr);
    }
    // Clear selection and reload fresh data from server
    setSelected(new Set());
    const fresh = await load();
    showToast(`${toUnblock.length} date${toUnblock.length > 1 ? "s" : ""} unblocked successfully.`);
  } catch (err) {
    showToast(err.message, "error");
    await load();
  } finally {
    setLoading(false);
  }
};

  // Calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const toDateStr = (d) => `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const upcomingBlocked = blocked
    .filter((b) => b.blockedDate >= todayStr)
    .sort((a, b) => a.blockedDate.localeCompare(b.blockedDate));

  // What's in the current selection
  const selectedBlockedDates = [...selected].filter((d) => isBlocked(d));
  const selectedAvailableDates = [...selected].filter((d) => !isBlocked(d));

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 max-w-sm px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3 text-white ${toast.type === "error" ? "bg-red-600" : "bg-slate-800"}`}
        >
          {toast.type === "error" ? (
            <svg
              className="w-5 h-5 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 mt-0.5 shrink-0 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          <p className="text-sm leading-relaxed">{toast.msg}</p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Availability Calendar
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Click dates to select them, then block or unblock. Patients with
          existing bookings will be notified automatically.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Calendar ── */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-100 transition"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-gray-900">
              {MONTHS[viewMonth]} {viewYear}
            </h2>
            <button
              onClick={nextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-100 transition"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold text-gray-400 py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} />;
              const dateStr = toDateStr(day);
              const isPast = dateStr < todayStr;
              const isToday = dateStr === todayStr;
              const blocked_ = isBlocked(dateStr);
              const sel = isSelected(dateStr);

              let cls =
                "relative w-full aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition select-none ";

              if (isPast) {
                cls += "text-gray-200 cursor-not-allowed ";
              } else if (blocked_ && sel) {
                // blocked + selected = highlight differently (about to unblock)
                cls +=
                  "bg-red-600 text-white ring-2 ring-offset-1 ring-red-400 cursor-pointer ";
              } else if (blocked_) {
                cls +=
                  "bg-red-100 text-red-600 border-2 border-red-300 cursor-pointer hover:bg-red-200 ";
              } else if (sel) {
                cls +=
                  "bg-blue-600 text-white ring-2 ring-offset-1 ring-blue-400 cursor-pointer shadow-md ";
              } else if (isToday) {
                cls +=
                  "bg-emerald-50 text-emerald-700 border-2 border-emerald-400 cursor-pointer hover:bg-emerald-100 font-bold ";
              } else {
                cls += "text-gray-700 hover:bg-gray-100 cursor-pointer ";
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  disabled={isPast}
                  className={cls}
                  title={
                    blocked_
                      ? `Blocked${isBlocked(dateStr) && blocked.find((b) => b.blockedDate === dateStr)?.reason ? ": " + blocked.find((b) => b.blockedDate === dateStr).reason : ""}`
                      : ""
                  }
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-emerald-50 border-2 border-emerald-400" />
              <span className="text-xs text-gray-500">Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300" />
              <span className="text-xs text-gray-500">Blocked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-blue-600" />
              <span className="text-xs text-gray-500">Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-gray-100" />
              <span className="text-xs text-gray-500">Available</span>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="space-y-4">
          {/* Action card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            {selected.size === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm font-semibold">
                  No dates selected
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Click one or more future dates on the calendar
                </p>
              </div>
            ) : (
              <>
                {/* Selected dates summary */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-gray-800">
                      {selected.size} date{selected.size > 1 ? "s" : ""}{" "}
                      selected
                    </p>
                    <button
                      onClick={() => setSelected(new Set())}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {[...selected].sort().map((d) => (
                      <div
                        key={d}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium ${isBlocked(d) ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}
                      >
                        <span>{displayDateShort(d)}</span>
                        <span className="text-xs opacity-60">
                          {isBlocked(d) ? "blocked" : "available"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Block available dates */}
                {selectedAvailableDates.length > 0 && (
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                      Reason for blocking (optional)
                    </label>
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Personal leave, Conference…"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 outline-none mb-2"
                    />
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-2">
                      <p className="text-amber-700 text-xs">
                        ⚠️ Booked appointments on selected dates will be{" "}
                        <strong>cancelled</strong> and patients notified.
                      </p>
                    </div>
                    <button
                      onClick={handleBlockSelected}
                      disabled={loading}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                    >
                      {loading
                        ? "Blocking…"
                        : `Block ${selectedAvailableDates.length} Date${selectedAvailableDates.length > 1 ? "s" : ""}`}
                    </button>
                  </div>
                )}

                {/* Unblock blocked dates */}
                {selectedBlockedDates.length > 0 && (
                  <button
                    onClick={handleUnblockSelected}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                  >
                    {loading
                      ? "Unblocking…"
                      : `✓ Unblock ${selectedBlockedDates.length} Date${selectedBlockedDates.length > 1 ? "s" : ""}`}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Upcoming blocked list */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              Upcoming Blocked Dates
              {upcomingBlocked.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {upcomingBlocked.length}
                </span>
              )}
            </h3>
            {upcomingBlocked.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-4">
                No blocked dates — you're fully available
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {upcomingBlocked.map((b) => (
                  <div
                    key={b.blockedDate}
                    className="flex items-start justify-between bg-red-50 border border-red-100 rounded-xl px-3 py-2.5"
                  >
                    <div>
                      <p className="text-red-700 text-xs font-bold">
                        {displayDateShort(b.blockedDate)}
                      </p>
                      {b.reason && (
                        <p className="text-red-400 text-xs mt-0.5 leading-snug">
                          {b.reason}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleUnblock(b.blockedDate)}
                      className="text-red-300 hover:text-red-600 transition ml-2 mt-0.5 shrink-0"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
