import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const STEPS = { FORM: "form", OTP: "otp", DONE: "done" };

export default function PatientSignup() {
  const navigate = useNavigate();
  const { signupPatient } = useAuth();
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const [step, setStep]     = useState(STEPS.FORM);
  const [loading, setLoading] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["","","","","",""]);
 
  const [errors, setErrors]   = useState({});
  const [form, setForm]       = useState({ name:"", age:"", email:"", phone:"", password:"", confirm:"" });

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const validateForm = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.age || form.age < 1 || form.age > 120) e.age = "Enter a valid age";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "Enter a 10-digit phone number";
    if (form.password.length < 6) e.password = "Minimum 6 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});
    try {
      const res = await api.sendOtp(form.email, "signup");
    
      setStep(STEPS.OTP);
    } catch (err) {
      setErrors({ form: err.message });
    } finally { setLoading(false); }
  };

  const handleOtpInput = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val;
    setOtpDigits(next);
    if (val && idx < 5) otpRefs[idx + 1].current?.focus();
    if (!val && idx > 0) otpRefs[idx - 1].current?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(""));
      otpRefs[5].current?.focus();
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length < 6) { setErrors({ otp: "Enter all 6 digits" }); return; }
    setLoading(true);
    setErrors({});
    try {
      await signupPatient({ name: form.name, age: form.age, email: form.email, phone: form.phone, password: form.password, otpCode: code });
      navigate("/patient/dashboard");
    } catch (err) {
      setErrors({ otp: err.message });
    } finally { setLoading(false); }
  };

  const resendOtp = async () => {
    setLoading(true);
    setErrors({});
    setOtpDigits(["","","","","",""]);
    try {
      await api.sendOtp(form.email, "signup");
    } catch (err) { setErrors({ otp: err.message }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </div>
            <span className="text-xl font-bold text-white tracking-wide">SmartCare</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {step === STEPS.FORM && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Create your account</h2>
                <p className="text-blue-300 text-sm mt-1">We'll verify your email with an OTP</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name" name="name" placeholder="Rahul Sharma" value={form.name} onChange={handleChange} error={errors.name} span />
                  <Field label="Age" name="age" type="number" placeholder="25" value={form.age} onChange={handleChange} error={errors.age} half />
                  <Field label="Phone" name="phone" placeholder="9999999999" value={form.phone} onChange={handleChange} error={errors.phone} half />
                  <Field label="Email Address" name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handleChange} error={errors.email} span />
                  <Field label="Password" name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} error={errors.password} half />
                  <Field label="Confirm Password" name="confirm" type="password" placeholder="Repeat password" value={form.confirm} onChange={handleChange} error={errors.confirm} half />
                </div>

                {errors.form && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{errors.form}</p>}

                <button type="submit" disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 mt-2">
                  {loading ? "Sending OTP…" : "Send Verification OTP →"}
                </button>
              </form>

              <p className="text-center text-blue-300 text-sm mt-5">
                Already have an account?{" "}
                <span onClick={() => navigate("/patient-login")} className="text-white font-semibold cursor-pointer hover:underline">Sign In</span>
              </p>
            </>
          )}

          {step === STEPS.OTP && (
            <>
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Check your email</h2>
                <p className="text-blue-300 text-sm mt-1">We sent a 6-digit code to <span className="text-white font-medium">{form.email}</span></p>
              </div>

              

              <form onSubmit={handleVerifyAndRegister} className="space-y-6">
                <div>
                  <label className="text-blue-300 text-sm font-medium block mb-3 text-center">Enter 6-digit OTP</label>
                  <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                    {otpDigits.map((d, i) => (
                      <input key={i} ref={otpRefs[i]} maxLength={1} value={d}
                        onChange={e => handleOtpInput(e.target.value, i)}
                        onKeyDown={e => e.key === "Backspace" && !d && i > 0 && otpRefs[i-1].current?.focus()}
                        className="w-12 h-14 text-center text-xl font-bold bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      />
                    ))}
                  </div>
                  {errors.otp && <p className="text-red-400 text-sm text-center mt-2">{errors.otp}</p>}
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-500/30">
                  {loading ? "Verifying…" : "Verify & Create Account"}
                </button>

                <div className="text-center space-y-2">
                  <p className="text-blue-300 text-sm">Didn't receive it?{" "}
                    <button type="button" onClick={resendOtp} disabled={loading} className="text-white font-semibold hover:underline disabled:opacity-50">Resend OTP</button>
                  </p>
                  <button type="button" onClick={() => { setStep(STEPS.FORM); setErrors({}); }} className="text-blue-400 text-sm hover:text-blue-300">← Change details</button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type="text", placeholder, value, onChange, error, span, half }) {
  const cls = span ? "col-span-2" : half ? "col-span-1" : "col-span-2";
  return (
    <div className={cls}>
      <label className="text-blue-300 text-xs font-medium block mb-1">{label}</label>
      <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange}
        className={`w-full bg-white/10 border text-white placeholder-white/30 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${error ? "border-red-500/60" : "border-white/20"}`} />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
