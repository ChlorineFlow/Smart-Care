import { useEffect, useState } from "react";
import api from "../../services/api";

const STATUS_COLORS = {
  booked: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  completed: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  cancelled: { bg: "bg-red-100", text: "text-red-600", dot: "bg-red-500" },
};

function StatCard({ label, value, sub, icon, color = "text-gray-900", trend }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center text-xl shrink-0">
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1">
          <span className={`text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
        <div className={`h-5 rounded-full ${color} flex items-center justify-end pr-2 transition-all duration-700`}
          style={{ width: `${Math.max(pct, value ? 5 : 0)}%` }}>
          {value > 0 && <span className="text-white text-xs font-bold">{value}</span>}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [statsData, apptData, docData, patData] = await Promise.all([
        api.getAdminStats(),
        api.getAllAppointments(),
        api.getAllDoctors(),
        api.getPatients(),
      ]);
      if (!mounted) return;
      setStats(statsData);
      setAppointments(apptData);
      setDoctors(docData);
      setPatients(patData);
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const completionRate = stats.totalAppointments
    ? Math.round((stats.completed / stats.totalAppointments) * 100) : 0;
  const cancellationRate = stats.totalAppointments
    ? Math.round((stats.cancelled / stats.totalAppointments) * 100) : 0;

  // Top 5 doctors by appointment count
  const doctorAppointmentCount = {};
  for (const a of appointments) {
    doctorAppointmentCount[a.doctorName] = (doctorAppointmentCount[a.doctorName] || 0) + 1;
  }
  const topDoctors = Object.entries(doctorAppointmentCount)
    .sort(([, a], [, b]) => b - a).slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Monthly appointments (last 6 months)
  const monthlyMap = {};
  for (const a of appointments) {
    const d = new Date(a.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const lbl = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    if (!monthlyMap[key]) monthlyMap[key] = { label: lbl, total: 0, completed: 0, cancelled: 0 };
    monthlyMap[key].total++;
    if (a.status === "completed") monthlyMap[key].completed++;
    if (a.status === "cancelled") monthlyMap[key].cancelled++;
  }
  const monthly = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, v]) => v);
  const maxMonthly = Math.max(...monthly.map(m => m.total), 1);

  // Specialization breakdown
  const specMap = {};
  for (const d of doctors) {
    specMap[d.specialization] = (specMap[d.specialization] || 0) + 1;
  }
  const topSpecs = Object.entries(specMap).sort(([, a], [, b]) => b - a).slice(0, 5)
    .map(([spec, count]) => ({ spec, count }));

  // Recent appointments
  const recent = [...appointments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  // New patients this month
  const thisMonth = new Date();
  const newPatientsThisMonth = patients.filter(p => {
    const d = new Date(p.createdAt);
    return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
  }).length;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter(a => a.date === todayStr && a.status === "booked").length;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-700 text-sm font-medium">Platform Live</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={stats.totalPatients} icon="🧑‍⚕️" color="text-blue-600" sub={`+${newPatientsThisMonth} this month`} />
        <StatCard label="Active Doctors" value={stats.totalDoctors} icon="👨‍⚕️" color="text-emerald-600" sub={`${doctors.length} registered`} />
        <StatCard label="Total Appointments" value={stats.totalAppointments} icon="📋" color="text-purple-600" sub={`${todayAppts} booked today`} />
        <StatCard label="Reviews Collected" value={stats.totalRatings} icon="⭐" color="text-amber-500" sub="patient feedback" />
      </div>

      {/* Status summary row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{stats.booked}</p>
          <p className="text-xs text-blue-500 font-semibold mt-1 uppercase tracking-wide">Upcoming</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{stats.completed}</p>
          <p className="text-xs text-green-500 font-semibold mt-1 uppercase tracking-wide">Completed · {completionRate}%</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
          <p className="text-xs text-red-400 font-semibold mt-1 uppercase tracking-wide">Cancelled · {cancellationRate}%</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Monthly trend */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-5">Monthly Appointments (Last 6 months)</h2>
          {monthly.length === 0
            ? <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
            : (
              <div className="space-y-3">
                {monthly.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-14 shrink-0">{m.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden relative">
                      <div className="h-6 bg-blue-200 rounded-full absolute inset-0 transition-all duration-700"
                        style={{ width: `${(m.total / maxMonthly) * 100}%` }} />
                      <div className="h-6 bg-emerald-500 rounded-full absolute inset-0 transition-all duration-700"
                        style={{ width: `${(m.completed / maxMonthly) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-6">{m.total}</span>
                  </div>
                ))}
                <div className="flex items-center gap-5 mt-2 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-200" /><span className="text-xs text-gray-500">Total</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-xs text-gray-500">Completed</span></div>
                </div>
              </div>
            )
          }
        </div>

        {/* Appointment breakdown */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-5">Appointment Status Breakdown</h2>
          <div className="space-y-4">
            {[
              { label: "Completed", value: stats.completed, color: "bg-emerald-500" },
              { label: "Upcoming", value: stats.booked, color: "bg-blue-500" },
              { label: "Cancelled", value: stats.cancelled, color: "bg-red-400" },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">{item.label}</span>
                  <span className="font-bold text-gray-900">{item.value}
                    <span className="text-gray-400 font-normal text-xs ml-1">
                      ({stats.totalAppointments ? Math.round((item.value / stats.totalAppointments) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-3 rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${stats.totalAppointments ? (item.value / stats.totalAppointments) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Specialization breakdown */}
          <h3 className="text-sm font-bold text-gray-800 mt-6 mb-3">Doctors by Specialization</h3>
          <div className="space-y-2">
            {topSpecs.map((s, i) => (
              <MiniBar key={i} label={s.spec} value={s.count}
                max={Math.max(...topSpecs.map(x => x.count), 1)} color="bg-slate-500" />
            ))}
          </div>
        </div>
      </div>

      {/* Top doctors + Recent appointments */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Top doctors */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-5">Top Doctors by Appointments</h2>
          {topDoctors.length === 0
            ? <p className="text-gray-400 text-sm text-center py-6">No appointment data yet</p>
            : (
              <div className="space-y-3">
                {topDoctors.map((d, i) => {
                  const doc = doctors.find(x => x.name === d.name);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-amber-100 text-amber-600" : i === 1 ? "bg-gray-100 text-gray-600" : "bg-orange-50 text-orange-500"
                        }`}>{i + 1}</span>
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-slate-600">{d.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{d.name}</p>
                        <p className="text-xs text-gray-400">{doc?.specialization || ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">{d.count}</p>
                        <p className="text-xs text-gray-400">appts</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>

        {/* Recent appointments */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Recent Appointments</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recent.length === 0
              ? <p className="text-gray-400 text-sm text-center py-8">No appointments yet</p>
              : recent.map(a => {
                const sc = STATUS_COLORS[a.status] || STATUS_COLORS.booked;
                return (
                  <div key={a.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-blue-600">{a.patientName?.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{a.patientName}</p>
                        <p className="text-xs text-gray-400 truncate">{a.doctorName} · {a.date} {a.time}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 ml-3 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                      {a.status}
                    </span>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    </div>
  );
}