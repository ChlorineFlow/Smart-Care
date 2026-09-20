import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import DoctorCard from "../../components/DoctorCard";
import { useAuth } from "../../context/AuthContext";

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n) => String(n).padStart(2, "0");

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay(); }

export default function BookAppointment() {
  const { user } = useAuth();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [blockedDates, setBlockedDates] = useState([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [minRatingFilter, setMinRatingFilter] = useState("0");
  const [slotFilter, setSlotFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating_desc");

  useEffect(() => {
    let mounted = true;
    api.getDoctors().then(data => { if (mounted) setDoctors(data); });
    return () => { mounted = false; };
  }, []);

  // Load blocked dates when doctor changes
  const [recurringBlocked, setRecurringBlocked] = useState([]);

  useEffect(() => {
    if (!selectedDoctorId) { setBlockedDates([]); setRecurringBlocked([]); return; }
    Promise.all([
      api.getBlockedDates(selectedDoctorId),
      api.getRecurringBlocks(selectedDoctorId),
    ]).then(([dates, recurring]) => {
      setBlockedDates(dates.map(b => b.blockedDate));
      setRecurringBlocked(recurring.map(r => r.dayOfWeek));
    }).catch(() => { });
  }, [selectedDoctorId]);

  const selectedDoctor = useMemo(
    () => doctors.find(d => d.id === selectedDoctorId),
    [doctors, selectedDoctorId]
  );

  const specializationOptions = useMemo(() =>
    Array.from(new Set(doctors.map(d => String(d.specialization || "").trim()).filter(Boolean))).sort(),
    [doctors]);

  const slotOptions = useMemo(() =>
    Array.from(new Set(doctors.flatMap(d => (d.slots ?? []).map(s => String(s).trim()).filter(Boolean)))).sort(),
    [doctors]);

  const filteredDoctors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const minRating = Number(minRatingFilter);
    let list = doctors.filter(d => {
      const name = String(d.name || "").toLowerCase();
      const spec = String(d.specialization || "").toLowerCase();
      return (!q || name.includes(q) || spec.includes(q))
        && (specializationFilter === "all" || d.specialization === specializationFilter)
        && Number(d.rating || 0) >= minRating
        && (slotFilter === "all" || (d.slots ?? []).includes(slotFilter));
    });
    return list.sort((a, b) => {
      if (sortBy === "rating_desc") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "experience_desc") return (b.experience || 0) - (a.experience || 0);
      if (sortBy === "reviews_desc") return (b.reviews || 0) - (a.reviews || 0);
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [doctors, searchTerm, specializationFilter, minRatingFilter, slotFilter, sortBy]);

  const isBlocked = (dateStr) => {
    if (blockedDates.includes(dateStr)) return true;
    const dow = new Date(dateStr + "T00:00:00").getDay();
    return recurringBlocked.includes(dow);
  };

  // Calendar navigation
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const toDateStr = (d) => `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;

  const handleDayClick = (dateStr) => {
    if (dateStr < todayStr) return;
    if (isBlocked(dateStr)) return; // can't select blocked date
    setDate(dateStr);
    setTime("");
    setMessage({ text: "", type: "" });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    if (!selectedDoctorId || !date || !time) {
      setMessage({ text: "Please choose a doctor, date and time slot.", type: "error" });
      return;
    }
    try {
      await api.bookAppointment({ patientId: user.id, doctorId: selectedDoctorId, date, time });
      setMessage({ text: "Appointment booked successfully! 🎉", type: "success" });
      setDate(""); setTime("");
      setDoctors(await api.getDoctors());
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDay(viewYear, viewMonth);
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
      <p className="text-sm text-gray-600 mt-0.5">Select a doctor and reserve your slot.</p>

      {/* Filters */}
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search doctor or specialty…"
          className="col-span-2 md:col-span-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <select value={specializationFilter} onChange={e => setSpecializationFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="all">All Specializations</option>
          {specializationOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="rating_desc">Top Rated</option>
          <option value="experience_desc">Most Experienced</option>
          <option value="reviews_desc">Most Reviewed</option>
          <option value="name_asc">Name A–Z</option>
        </select>
        <select value={minRatingFilter} onChange={e => setMinRatingFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="0">Any Rating</option>
          <option value="3">3★ & above</option>
          <option value="4">4★ & above</option>
          <option value="4.5">4.5★ & above</option>
        </select>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">

        {/* Doctor list */}
        <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
          {filteredDoctors.length === 0
            ? <p className="text-gray-400 text-sm text-center py-10">No doctors match your filters.</p>
            : filteredDoctors.map(doctor => (
              <DoctorCard key={doctor.id} doctor={doctor}
                actionLabel={selectedDoctorId === doctor.id ? "✓ Selected" : "Select Doctor"}
                onBook={(d) => { setSelectedDoctorId(d.id); setDate(""); setTime(""); }} />
            ))
          }
        </div>

        {/* Booking form */}
        <div className="h-fit rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
            <h2 className="text-white font-bold text-lg">Booking Details</h2>
            <p className="text-blue-200 text-sm mt-0.5">
              {selectedDoctor ? `${selectedDoctor.name} · ${selectedDoctor.specialization}` : "Select a doctor to continue"}
            </p>
          </div>

          <form onSubmit={handleBook} className="p-5 space-y-5">

            {!selectedDoctor ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <p className="text-gray-500 text-sm font-medium">No doctor selected</p>
                <p className="text-gray-400 text-xs mt-1">Choose a doctor from the list on the left</p>
              </div>
            ) : (
              <>
                {/* Availability Calendar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-gray-700">Select Date</label>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />Unavailable</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600 inline-block" />Selected</span>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-2xl p-4">
                    {/* Month nav */}
                    <div className="flex items-center justify-between mb-3">
                      <button type="button" onClick={prevMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                        <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-sm font-bold text-gray-800">{MONTHS[viewMonth]} {viewYear}</span>
                      <button type="button" onClick={nextMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                        <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-1">
                      {DAYS.map(d => (
                        <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                      ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {calendarDays.map((day, idx) => {
                        if (!day) return <div key={`e-${idx}`} />;
                        const dateStr = toDateStr(day);
                        const isPast = dateStr < todayStr;
                        const blocked_ = isBlocked(dateStr);
                        const isToday = dateStr === todayStr;
                        const isSel = date === dateStr;

                        let cls = "w-full aspect-square flex items-center justify-center rounded-lg text-xs font-semibold transition select-none ";
                        if (isPast) cls += "text-gray-200 cursor-not-allowed ";
                        else if (blocked_) cls += "bg-red-100 text-red-400 cursor-not-allowed border border-red-200 ";
                        else if (isSel) cls += "bg-blue-600 text-white shadow font-bold cursor-pointer ";
                        else if (isToday) cls += "bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-pointer hover:bg-emerald-100 ";
                        else cls += "text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer ";

                        return (
                          <button key={dateStr} type="button"
                            onClick={() => handleDayClick(dateStr)}
                            disabled={isPast || blocked_}
                            className={cls}
                            title={blocked_ ? "Doctor unavailable on this date" : ""}>
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {date && (
                    <p className="text-xs text-blue-600 font-medium mt-1.5 text-center">
                      Selected: {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>

                {/* Time slots */}
                {date && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">Select Time Slot</label>
                    {(selectedDoctor?.slots ?? []).length === 0
                      ? <p className="text-gray-400 text-sm">No slots available</p>
                      : (
                        <div className="flex flex-wrap gap-2">
                          {(selectedDoctor?.slots ?? []).map(slot => (
                            <button key={slot} type="button" onClick={() => setTime(slot)}
                              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${time === slot
                                ? "bg-blue-600 border-blue-600 text-white shadow"
                                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                                }`}>
                              {slot}
                            </button>
                          ))}
                        </div>
                      )
                    }
                  </div>
                )}

                {/* Message */}
                {message.text && (
                  <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${message.type === "error"
                    ? "bg-red-50 border border-red-200 text-red-700"
                    : "bg-green-50 border border-green-200 text-green-700"
                    }`}>
                    {message.type === "success"
                      ? <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      : <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    }
                    {message.text}
                  </div>
                )}

                <button type="submit" disabled={!date || !time}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition shadow">
                  Confirm Booking
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}