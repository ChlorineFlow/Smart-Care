import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const MODE = { PASSWORD: "password", OTP_REQUEST: "otp_request", OTP_VERIFY: "otp_verify" };

export default function PatientLogin() {
  const navigate = useNavigate();
  const { patientLogin, patientOtpLogin } = useAuth();
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const [mode, setMode] = useState(MODE.PASSWORD);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [otpEmail, setOtpEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── Password login ────────────────────────────────────────
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    const err = {};
    if (!/\S+@\S+\.\S+/.test(form.email)) err.email = "Enter a valid email";
    if (!form.password) err.password = "Password is required";
    if (Object.keys(err).length) { setErrors(err); return; }
    setLoading(true); setErrors({});
    try {
      await patientLogin({ email: form.email, password: form.password });
      navigate("/patient/dashboard");
    } catch (err) { setErrors({ form: err.message }); }
    finally { setLoading(false); }
  };

  // ── Request OTP ───────────────────────────────────────────
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(otpEmail)) { setErrors({ otpEmail: "Enter a valid email" }); return; }
    setLoading(true); setErrors({});
    try {
      const res = await api.sendOtp(otpEmail, "login");

      setMode(MODE.OTP_VERIFY);
    } catch (err) { setErrors({ otpEmail: err.message }); }
    finally { setLoading(false); }
  };

  // ── Verify OTP & login ────────────────────────────────────
  const handleOtpLogin = async (e) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length < 6) { setErrors({ otp: "Enter all 6 digits" }); return; }
    setLoading(true); setErrors({});
    try {
      await patientOtpLogin({ email: otpEmail, code });
      navigate("/patient/dashboard");
    } catch (err) { setErrors({ otp: err.message }); }
    finally { setLoading(false); }
  };

  const handleOtpInput = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits]; next[idx] = val; setOtpDigits(next);
    if (val && idx < 5) otpRefs[idx + 1].current?.focus();
    if (!val && idx > 0) otpRefs[idx - 1].current?.focus();
  };

  const resendOtp = async () => {
    setLoading(true); setErrors({}); setOtpDigits(["", "", "", "", "", ""]);
    try { const r = await api.sendOtp(otpEmail, "login"); }
    catch (err) { setErrors({ otp: err.message }); }
    finally { setLoading(false); }
  };

  const inputCls = (err) =>
    `w-full bg-white/10 border text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${err ? "border-red-500/60" : "border-white/20"}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>
            <span className="text-xl font-bold text-white tracking-wide">SmartCare</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* ── Tab toggle ──────────────────────────────────── */}
          {mode !== MODE.OTP_VERIFY && (
            <div className="flex bg-white/10 rounded-xl p-1 mb-6">
              <button onClick={() => { setMode(MODE.PASSWORD); setErrors({}); }}
                className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${mode === MODE.PASSWORD ? "bg-blue-500 text-white shadow" : "text-blue-300 hover:text-white"}`}>
                Password Login
              </button>
              <button onClick={() => { setMode(MODE.OTP_REQUEST); setErrors({}); }}
                className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${mode === MODE.OTP_REQUEST ? "bg-blue-500 text-white shadow" : "text-blue-300 hover:text-white"}`}>
                Login with OTP
              </button>
            </div>
          )}

          {/* ── Password mode ───────────────────────────────── */}
          {mode === MODE.PASSWORD && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                <p className="text-blue-300 text-sm mt-1">Sign in to your patient account</p>
              </div>
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="text-blue-300 text-xs font-medium block mb-1">Email Address</label>
                  <input name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handleChange} className={inputCls(errors.email)} />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="text-blue-300 text-xs font-medium block mb-1">Password</label>
                  <input name="password" type="password" placeholder="Your password" value={form.password} onChange={handleChange} className={inputCls(errors.password)} />
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>
                {errors.form && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{errors.form}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-500/30">
                  {loading ? "Signing in…" : "Sign In"}
                </button>
              </form>
            </>
          )}

          {/* ── OTP request mode ────────────────────────────── */}
          {mode === MODE.OTP_REQUEST && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Passwordless Login</h2>
                <p className="text-blue-300 text-sm mt-1">We'll send a one-time code to your email</p>
              </div>
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="text-blue-300 text-xs font-medium block mb-1">Registered Email</label>
                  <input type="email" placeholder="you@email.com" value={otpEmail} onChange={e => setOtpEmail(e.target.value)} className={inputCls(errors.otpEmail)} />
                  {errors.otpEmail && <p className="text-red-400 text-xs mt-1">{errors.otpEmail}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-500/30">
                  {loading ? "Sending OTP…" : "Send OTP →"}
                </button>
              </form>
            </>
          )}

          {/* ── OTP verify mode ─────────────────────────────── */}
          {mode === MODE.OTP_VERIFY && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Enter OTP</h2>
                <p className="text-blue-300 text-sm mt-1">Sent to <span className="text-white font-medium">{otpEmail}</span></p>
              </div>



              <form onSubmit={handleOtpLogin} className="space-y-6">
                <div>
                  <div className="flex gap-2 justify-center">
                    {otpDigits.map((d, i) => (
                      <input key={i} ref={otpRefs[i]} maxLength={1} value={d}
                        onChange={e => handleOtpInput(e.target.value, i)}
                        onKeyDown={e => e.key === "Backspace" && !d && i > 0 && otpRefs[i - 1].current?.focus()}
                        className="w-11 h-13 text-center text-xl font-bold bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                    ))}
                  </div>
                  {errors.otp && <p className="text-red-400 text-sm text-center mt-2">{errors.otp}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-500/30">
                  {loading ? "Verifying…" : "Sign In with OTP"}
                </button>
                <div className="text-center space-y-2">
                  <p className="text-blue-300 text-sm">Didn't get it?{" "}
                    <button type="button" onClick={resendOtp} disabled={loading} className="text-white font-semibold hover:underline disabled:opacity-50">Resend</button>
                  </p>
                  <button type="button" onClick={() => { setMode(MODE.OTP_REQUEST); setErrors({}); setOtpDigits(["", "", "", "", "", ""]); }} className="text-blue-400 text-sm hover:text-blue-300">← Change email</button>
                </div>
              </form>
            </>
          )}

          {mode !== MODE.OTP_VERIFY && (
            <p className="text-center text-blue-300 text-sm mt-6">
              New to SmartCare?{" "}
              <span onClick={() => navigate("/patient-signup")} className="text-white font-semibold cursor-pointer hover:underline">Create account</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
