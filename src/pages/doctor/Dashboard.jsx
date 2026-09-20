import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function MiniBar({ label, value, max, color }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 shrink-0 text-right">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
        <div
          className={`h-5 rounded-full ${color} flex items-center justify-end pr-2 transition-all duration-700`}
          style={{ width: `${Math.max(pct, value ? 6 : 0)}%` }}
        >
          {value > 0 && <span className="text-white text-xs font-bold">{value}</span>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center text-xl shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [analytics, setAnalytics]       = useState(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const load = async () => {
      try {
        const [appts, ana] = await Promise.all([
          api.getAppointmentsForDoctor(user.id),
          api.getDoctorAnalytics(user.id),
        ]);
        if (!mounted) return;
        setAppointments(appts);
        setAnalytics(ana);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const today      = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter(a => a.date === today && a.status === "booked");
  const upcoming   = appointments.filter(a => a.date >= today && a.status === "booked");
  const completed  = appointments.filter(a => a.status === "completed");
  const cancelled  = appointments.filter(a => a.status === "cancelled");

  const completionRate = appointments.length
    ? Math.round((completed.length / appointments.length) * 100) : 0;

  // Busiest days from analytics
  const busyDays   = analytics?.busyDays   || [];
  const maxBusy    = Math.max(...busyDays.map(d => d.count), 1);

  // Monthly trend
  const monthly    = analytics?.monthlyTrend || [];
  const maxMonthly = Math.max(...monthly.map(m => m.total), 1);

  // Rating distribution
  const ratingDist = analytics?.ratingDistribution || [];
  const maxRating  = Math.max(...ratingDist.map(r => r.count), 1);

  // Recent appointments (today + upcoming, max 5)
  const recentAppts = [...appointments]
    .filter(a => a.status === "booked")
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  const greetingHour = new Date().getHours();
  const greeting     = greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-7">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {user?.name?.split(" ")[0] ?? "Doctor"} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
          <span className="text-emerald-700 text-sm font-semibold">{todayAppts.length} appointment{todayAppts.length !== 1 ? "s" : ""} today</span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📅" label="Today's Appointments" value={todayAppts.length}  color="text-blue-600"    sub="booked for today" />
        <StatCard icon="⏳" label="Upcoming"             value={upcoming.length}    color="text-purple-600"  sub="incl. today" />
        <StatCard icon="✅" label="Completed"            value={completed.length}   color="text-emerald-600" sub={`${completionRate}% completion rate`} />
        <StatCard icon="⭐" label="Avg Rating"           value={`${analytics?.summary?.avgRating ?? "—"}`} color="text-amber-500" sub={`${analytics?.summary?.totalReviews ?? 0} reviews`} />
      </div>

      {/* ── Today's Schedule + Monthly Trend ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Today's schedule */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Today's Schedule</h2>
            <button onClick={() => navigate("/doctor/appointments")}
              className="text-xs text-blue-600 font-semibold hover:underline">
              View all →
            </button>
          </div>
          {todayAppts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-gray-500 font-medium">No appointments today</p>
              <p className="text-gray-400 text-xs mt-1">Enjoy your free day!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {todayAppts.map(a => (
                <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0">
                    <span className="text-blue-700 font-bold text-sm leading-none">{a.time.split(":")[0]}</span>
                    <span className="text-blue-400 text-xs">:{a.time.split(":")[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{a.patientName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.specialization}</p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {a.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly trend mini chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Monthly Appointments</h2>
            <button onClick={() => navigate("/doctor/analytics")}
              className="text-xs text-blue-600 font-semibold hover:underline">
              Full analytics →
            </button>
          </div>
          {monthly.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {monthly.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-12 shrink-0">{m.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden relative">
                    <div className="h-6 bg-blue-200 rounded-full absolute inset-0 transition-all duration-700"
                      style={{ width:`${(m.total/maxMonthly)*100}%` }}/>
                    <div className="h-6 bg-emerald-500 rounded-full absolute inset-0 transition-all duration-700"
                      style={{ width:`${(m.completed/maxMonthly)*100}%` }}/>
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-5">{m.total}</span>
                </div>
              ))}
              <div className="flex items-center gap-5 mt-2 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-200"/><span className="text-xs text-gray-400">Total</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"/><span className="text-xs text-gray-400">Completed</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Busiest Days + Rating Distribution ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Busiest days */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-5">Busiest Days of the Week</h2>
          <div className="space-y-2">
            {busyDays.map((d, i) => (
              <MiniBar key={i} label={d.day} value={d.count} max={maxBusy} color="bg-purple-500"/>
            ))}
          </div>
        </div>

        {/* Rating distribution */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Rating Breakdown</h2>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-500">{analytics?.summary?.avgRating ?? "—"} ⭐</p>
              <p className="text-xs text-gray-400">{analytics?.summary?.totalReviews ?? 0} reviews</p>
            </div>
          </div>
          <div className="space-y-2">
            {[5,4,3,2,1].map(score => {
              const found = ratingDist.find(r => r.score === score);
              const count = found?.count || 0;
              const colors = { 5:"bg-emerald-500", 4:"bg-blue-400", 3:"bg-yellow-400", 2:"bg-orange-400", 1:"bg-red-400" };
              return (
                <div key={score} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-8 text-right">{score} ★</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div className={`h-5 rounded-full ${colors[score]} transition-all duration-700`}
                      style={{ width:`${(count/maxRating)*100}%` }}/>
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-4">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Upcoming Appointments + Quick Stats ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Upcoming appointments */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Upcoming Appointments</h2>
            <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-semibold">{upcoming.length} total</span>
          </div>
          {recentAppts.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-gray-400 text-sm">No upcoming appointments</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentAppts.map(a => (
                <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                    <span className="text-purple-600 font-bold text-sm">{a.patientName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{a.patientName}</p>
                    <p className="text-xs text-gray-400">{a.date} at {a.time}</p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                    Booked
                  </span>
                </div>
              ))}
            </div>
          )}
          {upcoming.length > 5 && (
            <div className="px-6 py-3 border-t border-gray-100">
              <button onClick={() => navigate("/doctor/appointments")}
                className="text-xs text-blue-600 font-semibold hover:underline">
                View all {upcoming.length} appointments →
              </button>
            </div>
          )}
        </div>

        {/* Quick stats panel */}
        <div className="space-y-4">
          {/* Status breakdown */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Appointment Breakdown</h3>
            <div className="space-y-3">
              {[
                { label:"Completed", value: completed.length, total: appointments.length, color:"bg-emerald-500" },
                { label:"Upcoming",  value: upcoming.length,  total: appointments.length, color:"bg-blue-500" },
                { label:"Cancelled", value: cancelled.length, total: appointments.length, color:"bg-red-400" },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-bold text-gray-700">{item.value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full ${item.color} transition-all duration-700`}
                      style={{ width:`${item.total ? (item.value/item.total)*100 : 0}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { icon:"📋", label:"View Appointments", path:"/doctor/appointments" },
                { icon:"📄", label:"Prescriptions",     path:"/doctor/prescriptions" },
                { icon:"📅", label:"Manage Availability", path:"/doctor/availability" },
                { icon:"📊", label:"Full Analytics",    path:"/doctor/analytics" },
                { icon:"⭐", label:"Patient Reviews",   path:"/doctor/reviews" },
              ].map(item => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition text-left group">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{item.label}</span>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 ml-auto transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}