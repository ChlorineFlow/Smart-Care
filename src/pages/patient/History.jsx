import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AppointmentCard from "../../components/AppointmentCard";

const pad = (n) => String(n).padStart(2, "0");
const MONTHS_R = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_R   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function getDaysInMonthR(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayR(y, m)    { return new Date(y, m, 1).getDay(); }

export default function History() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [rescheduleTarget, setRescheduleTarget] = useState(null); // appointment being rescheduled
  const [doctor, setDoctor]   = useState(null);  // doctor details for slot picker
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const todayObj  = new Date();
const todayStrR = `${todayObj.getFullYear()}-${pad(todayObj.getMonth()+1)}-${pad(todayObj.getDate())}`;
const [calYear,  setCalYear]  = useState(todayObj.getFullYear());
const [calMonth, setCalMonth] = useState(todayObj.getMonth());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const reload = async () => {
    if (!user) return;
    setAppointments(await api.getAppointmentsForPatient(user.id));
  };

  useEffect(() => { reload(); }, [user]);

  const handleCancel = async (appointmentId) => {
    await api.updateAppointmentStatus(appointmentId, "cancelled");
    await reload();
  };

  const [blockedDates, setBlockedDates]     = useState([]);
const [recurringBlocked, setRecurringBlocked] = useState([]);

const openReschedule = async (appointment) => {
  setRescheduleTarget(appointment);
  setNewDate(appointment.date);
  setNewTime("");
  setMessage({ text: "", type: "" });
  try {
    const [doc, dates, recurring] = await Promise.all([
      api.getDoctorById(appointment.doctorId),
      api.getBlockedDates(appointment.doctorId),
      api.getRecurringBlocks(appointment.doctorId),
    ]);
    setDoctor(doc);
    setBlockedDates(dates.map(b => b.blockedDate));
    setRecurringBlocked(recurring.map(r => r.dayOfWeek));
  } catch {
    setDoctor(null);
    setBlockedDates([]);
    setRecurringBlocked([]);
  }
};

const isDateBlocked = (dateStr) => {
  if (blockedDates.includes(dateStr)) return true;
  const dow = new Date(dateStr + "T00:00:00").getDay();
  return recurringBlocked.includes(dow);
};

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime) {
      setMessage({ text: "Please select a new date and time slot.", type: "error" });
      return;
    }
    if (newDate === rescheduleTarget.date && newTime === rescheduleTarget.time) {
      setMessage({ text: "Please choose a different date or time.", type: "error" });
      return;
    }
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      await api.rescheduleAppointment(rescheduleTarget.id, newDate, newTime);
      setMessage({ text: "Appointment rescheduled! A confirmation email has been sent.", type: "success" });
      await reload();
      setTimeout(() => {
        setRescheduleTarget(null);
        setMessage({ text: "", type: "" });
      }, 2000);
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Min date = today
  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Appointment History</h1>
      <p className="text-sm text-gray-600">View all your bookings and status updates.</p>

      <div className="mt-6 space-y-3">
        {appointments.length ? (
          appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              canCancel
              canReschedule
              onCancel={handleCancel}
              onReschedule={openReschedule}
            />
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
            No appointments yet.
          </p>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

            {/* Modal header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">Reschedule Appointment</h3>
                  <p className="text-blue-200 text-sm mt-0.5">{rescheduleTarget.doctorName} · {rescheduleTarget.specialization}</p>
                </div>
                <button onClick={() => setRescheduleTarget(null)}
                  className="text-blue-200 hover:text-white transition">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleReschedule} className="p-6 space-y-5">

              {/* Current slot info */}
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p className="text-red-700 text-sm">
  Current: <span className="font-semibold">
    {String(rescheduleTarget.date).slice(0, 10)}
  </span> at <span className="font-semibold">{rescheduleTarget.time}</span>
</p>
              </div>

              {/* New date */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">New Date</label>
                {/* Mini calendar for date selection */}
<div className="border border-gray-200 rounded-xl p-3">
  {/* Month nav */}
  <div className="flex items-center justify-between mb-2">
    <button type="button"
      onClick={() => { if (calMonth===0){setCalMonth(11);setCalYear(y=>y-1);} else setCalMonth(m=>m-1); }}
      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100">
      <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
    </button>
    <span className="text-xs font-bold text-gray-700">{MONTHS_R[calMonth]} {calYear}</span>
    <button type="button"
      onClick={() => { if (calMonth===11){setCalMonth(0);setCalYear(y=>y+1);} else setCalMonth(m=>m+1); }}
      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100">
      <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
    </button>
  </div>
  {/* Day headers */}
  <div className="grid grid-cols-7 mb-1">
    {DAYS_R.map(d => <div key={d} className="text-center text-xs text-gray-400 font-medium py-0.5">{d[0]}</div>)}
  </div>
  {/* Days */}
  <div className="grid grid-cols-7 gap-1">
    {(() => {
      const days = [];
      const firstDay = getFirstDayR(calYear, calMonth);
      const total    = getDaysInMonthR(calYear, calMonth);
      for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`}/>);
      for (let d = 1; d <= total; d++) {
        const ds      = `${calYear}-${pad(calMonth+1)}-${pad(d)}`;
        const isPast  = ds < todayStrR;
        const blocked = isDateBlocked(ds);
        const isSel   = newDate === ds;
        let cls = "w-full h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition ";
        if (isPast)   cls += "text-gray-200 cursor-not-allowed ";
        else if (blocked) cls += "bg-red-100 text-red-400 cursor-not-allowed ";
        else if (isSel)   cls += "bg-blue-600 text-white font-bold cursor-pointer ";
        else              cls += "text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer ";
        days.push(
          <button key={ds} type="button" disabled={isPast||blocked}
            onClick={() => { setNewDate(ds); setNewTime(""); }}
            className={cls}
            title={blocked ? "Doctor unavailable" : ""}>
            {d}
          </button>
        );
      }
      return days;
    })()}
  </div>
  {/* Legend */}
  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
    <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-3 h-3 rounded bg-red-100 inline-block"/>Unavailable</span>
    <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-3 h-3 rounded bg-blue-600 inline-block"/>Selected</span>
  </div>
</div>
              </div>

              {/* Time slots */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">New Time Slot</label>
                {doctor?.slots?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {doctor.slots.map(slot => (
                      <button key={slot} type="button" onClick={() => setNewTime(slot)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                          newTime === slot
                            ? "bg-blue-600 border-blue-600 text-white shadow"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                        }`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Loading slots…</p>
                )}
              </div>

              {/* Message */}
              {message.text && (
                <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${
                  message.type === "error"
                    ? "bg-red-50 border border-red-200 text-red-700"
                    : "bg-green-50 border border-green-200 text-green-700"
                }`}>
                  {message.type === "success"
                    ? <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    : <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  }
                  {message.text}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition">
                  {loading ? "Rescheduling…" : "Confirm Reschedule"}
                </button>
                <button type="button" onClick={() => setRescheduleTarget(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}