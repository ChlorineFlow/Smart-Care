import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const BAR_COLORS = {
  1: "bg-red-400",
  2: "bg-orange-400",
  3: "bg-yellow-400",
  4: "bg-blue-400",
  5: "bg-emerald-500",
};

function StatCard({ label, value, sub, color = "text-gray-900", icon }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

function BarChart({ data, valueKey, labelKey, color = "bg-blue-500", maxLabel }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-10 shrink-0 text-right">{item[labelKey]}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            <div
              className={`h-6 rounded-full ${color} flex items-center justify-end pr-2 transition-all duration-500`}
              style={{ width: `${Math.max((item[valueKey] / max) * 100, item[valueKey] ? 8 : 0)}%` }}
            >
              {item[valueKey] > 0 && (
                <span className="text-white text-xs font-bold">{item[valueKey]}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DoctorAnalytics() {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState("all"); // all | month | week

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.getDoctorAnalytics(user.id);
        if (mounted) setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500 text-sm">Failed to load analytics.</p>;

  const { summary, busyDays, monthlyTrend, slotPopularity, ratingDistribution, recentRatings } = data;

  const maxRatingCount = Math.max(...ratingDistribution.map(r => r.count), 1);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Performance overview and appointment insights</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Appointments" value={summary.total}          icon="📋" />
        <StatCard label="Completed"          value={summary.completed}      icon="✅" color="text-emerald-600" />
        <StatCard label="Today's Bookings"   value={summary.todayCount}     icon="📅" color="text-blue-600" />
        <StatCard label="This Week"          value={summary.weekCount}       icon="📆" color="text-purple-600" />
        <StatCard label="Completion Rate"    value={`${summary.completionRate}%`} icon="🎯" color="text-emerald-600" sub="of all appointments" />
        <StatCard label="Avg Rating"         value={`⭐ ${summary.avgRating}`} icon="🌟" color="text-amber-500" sub={`${summary.totalReviews} reviews`} />
        <StatCard label="Booked (Upcoming)"  value={summary.booked}         icon="⏳" color="text-blue-600" />
        <StatCard label="Cancelled"          value={summary.cancelled}      icon="❌" color="text-red-500" />
      </div>

      {/* Status donut + Monthly trend */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Appointment status breakdown */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-5">Appointment Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "Completed", value: summary.completed, total: summary.total, color: "bg-emerald-500" },
              { label: "Booked",    value: summary.booked,    total: summary.total, color: "bg-blue-500" },
              { label: "Cancelled", value: summary.cancelled, total: summary.total, color: "bg-red-400" },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">{item.label}</span>
                  <span className="text-gray-900 font-bold">{item.value}
                    <span className="text-gray-400 font-normal text-xs ml-1">
                      ({item.total ? Math.round((item.value / item.total) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-3 rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${item.total ? (item.value / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly trend */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-5">Monthly Trend (Last 6 months)</h2>
          {monthlyTrend.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-2">
              {monthlyTrend.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-14 shrink-0">{m.label}</span>
                  <div className="flex-1 flex gap-1 items-center">
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden relative">
                      <div
                        className="h-5 bg-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${(m.total / Math.max(...monthlyTrend.map(x => x.total), 1)) * 100}%` }}
                      />
                      <div
                        className="h-5 bg-emerald-500 rounded-full absolute top-0 left-0 transition-all duration-500"
                        style={{ width: `${(m.completed / Math.max(...monthlyTrend.map(x => x.total), 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-6">{m.total}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-400"/><span className="text-xs text-gray-500">Total</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"/><span className="text-xs text-gray-500">Completed</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Busiest days + Slot popularity */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Busiest days */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-5">Busiest Days of the Week</h2>
          <BarChart data={busyDays} valueKey="count" labelKey="day" color="bg-purple-500" />
        </div>

        {/* Slot popularity */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-5">Most Popular Time Slots</h2>
          {slotPopularity.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <BarChart data={slotPopularity} valueKey="count" labelKey="time" color="bg-blue-500" />
          )}
        </div>
      </div>

      {/* Rating distribution + Recent reviews */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Rating distribution */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">Rating Distribution</h2>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-500">{summary.avgRating} ⭐</p>
              <p className="text-xs text-gray-400">{summary.totalReviews} reviews</p>
            </div>
          </div>
          <div className="space-y-2">
            {[5,4,3,2,1].map(score => {
              const found = ratingDistribution.find(r => r.score === score);
              const count = found?.count || 0;
              return (
                <div key={score} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-8 text-right">{score} ★</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-5 rounded-full ${BAR_COLORS[score]} transition-all duration-500`}
                      style={{ width: `${(count / maxRatingCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-4">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent reviews */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-5">Recent Patient Reviews</h2>
          {recentRatings.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No reviews yet</p>
          ) : (
            <div className="space-y-4">
              {recentRatings.map((r, i) => (
                <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-800">{r.patientName}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-sm ${s <= r.score ? "text-amber-400" : "text-gray-200"}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-gray-500 leading-relaxed">{r.comment}</p>}
                  <p className="text-xs text-gray-300 mt-1">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}