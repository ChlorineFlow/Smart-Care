import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!/\S+@\S+\.\S+/.test(form.email)) err.email = "Enter a valid email";
    if (!form.password || form.password.length < 6) err.password = "Password must be at least 6 characters";
    if (Object.keys(err).length) { setErrors(err); return; }
    setLoading(true); setErrors({});
    try {
      await login({ role: "admin", email: form.email, password: form.password });
      navigate("/admin/dashboard");
    } catch (err) { setErrors({ form: err.message }); }
    finally { setLoading(false); }
  };

  const inputCls = (err) =>
    `w-full bg-slate-800 border text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none transition ${err ? "border-red-500/60" : "border-slate-700"}`;

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-900 to-slate-800 p-12 border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
          <span className="text-white font-bold text-lg tracking-wide">SmartCare</span>
        </div>

        <div>
          <div className="w-12 h-12 bg-slate-700 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Administration Panel</h2>
          <p className="text-slate-400 leading-relaxed">Manage doctors, monitor appointments, and oversee the SmartCare platform from one secure dashboard.</p>

          <div className="mt-10 space-y-3">
            {["Manage doctor accounts & credentials", "Monitor all appointments", "View platform analytics & reports", "Control system settings"].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-slate-400 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs">© 2024 SmartCare. Restricted access.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 text-xs font-medium">Secure Admin Access</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Admin Sign In</h1>
            <p className="text-slate-400 text-sm mt-2">Enter your administrator credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1.5">Email Address</label>
              <input name="email" type="email" placeholder="admin@smartcare.app" value={form.email} onChange={handleChange} className={inputCls(errors.email)} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-slate-400 text-xs font-medium block mb-1.5">Password</label>
              <div className="relative">
                <input name="password" type={showPw ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={handleChange} className={inputCls(errors.password)} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                  {showPw
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {errors.form && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-red-400 text-sm">{errors.form}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-bold py-3 rounded-xl transition mt-2">
              {loading ? "Authenticating…" : "Sign In to Dashboard"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <p className="text-slate-500 text-xs text-center">Default credentials</p>
            <p className="text-slate-400 text-xs text-center mt-1 font-mono">admin@smartcare.app  ·  Admin@2024</p>
          </div>
        </div>
      </div>
    </div>
  );
}
