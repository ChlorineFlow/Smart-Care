import { useNavigate } from "react-router-dom";

// Doctors are added by admin only — this page redirects to login
export default function DoctorSignup() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 px-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Doctor Registration</h2>
        <p className="text-emerald-300 leading-relaxed">Doctor accounts are created by the SmartCare administrator. Please contact your institution's admin to have your account set up.</p>
        <p className="text-emerald-300 mt-3">Once your account is created, you will receive your login credentials (email & password) from the admin.</p>
        <button onClick={() => navigate("/doctor-login")}
          className="mt-8 w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-emerald-500/30">
          Go to Doctor Login
        </button>
        <button onClick={() => navigate("/")} className="mt-3 text-emerald-400 text-sm hover:text-emerald-300">← Back to Home</button>
      </div>
    </div>
  );
}
