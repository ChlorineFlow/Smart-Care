import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const EMPTY = { name:"", age:"", email:"", phone:"", specialization:"", experience:"", password:"" };

const SPECIALIZATIONS = [
  "Cardiologist","Dermatologist","Neurologist","Orthopedic Surgeon","Pediatrician",
  "Psychiatrist","Gynecologist","Ophthalmologist","ENT Specialist","General Physician",
  "Oncologist","Urologist","Pulmonologist","Gastroenterologist","Endocrinologist",
];

function generatePassword(name) {
  const clean = name.replace(/\s+/g, "").replace(/^Dr\.?\s*/i, "");
  const clean2 = clean.slice(0, 6) || "Doctor";
  return `${clean2}@${Math.floor(100 + Math.random() * 900)}`;
}

export default function ManageDoctors() {
  const { user } = useAuth();
  const [doctors, setDoctors]   = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]       = useState(null);
  const [search, setSearch]     = useState("");
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showPassword, setShowPassword]   = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    try { setDoctors(await api.getAllDoctors()); } catch {}
  };
  useEffect(() => { load(); }, []);

  const onChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(p => ({ ...p, [e.target.name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if (!form.specialization) e.specialization = "Select a specialization";
    if (!form.password || form.password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.addDoctor({ ...form, adminId: user?.id });
      setForm(EMPTY);
      setShowForm(false);
      showToast(`Dr. ${form.name} added successfully. Credentials: ${form.email} / ${form.password}`);
      await load();
    } catch (err) { showToast(err.message, "error"); }
    finally { setSubmitting(false); }
  };

  const handleToggleStatus = async (doctor) => {
    try {
      await api.toggleDoctorStatus(doctor.id, !doctor.isActive);
      showToast(`${doctor.name} ${doctor.isActive ? "deactivated" : "reactivated"}`);
      await load();
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleDelete = async (doctorId) => {
    try {
      await api.removeDoctor(doctorId);
      showToast("Doctor removed");
      setConfirmDelete(null);
      await load();
    } catch (err) { showToast(err.message, "error"); }
  };

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = (err) =>
    `w-full bg-gray-50 border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition ${err ? "border-red-400" : "border-gray-200"}`;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 max-w-sm px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-fade-in ${toast.type==="error" ? "bg-red-600" : "bg-slate-800"} text-white`}>
          {toast.type === "error"
            ? <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            : <svg className="w-5 h-5 mt-0.5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          }
          <p className="text-sm leading-relaxed">{toast.msg}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Doctors</h1>
          <p className="text-gray-500 text-sm mt-0.5">{doctors.length} doctor{doctors.length !== 1 ? "s" : ""} registered</p>
        </div>
        <button onClick={() => { setShowForm(p => !p); setErrors({}); setForm(EMPTY); }}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition shadow">
          {showForm
            ? <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg> Cancel</>
            : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg> Add Doctor</>
          }
        </button>
      </div>

      {/* Add Doctor Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-slate-900 px-6 py-4">
            <h3 className="text-white font-semibold">New Doctor Registration</h3>
            <p className="text-slate-400 text-xs mt-0.5">Assign credentials — the doctor will use these to log in</p>
          </div>
          <form onSubmit={onSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">Full Name *</label>
                <input name="name" value={form.name} onChange={onChange} placeholder="Dr. First Last" className={inputCls(errors.name)} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Age</label>
                <input name="age" type="number" value={form.age} onChange={onChange} placeholder="35" className={inputCls(false)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Email Address *</label>
                <input name="email" type="email" value={form.email} onChange={onChange} placeholder="doctor@hospital.com" className={inputCls(errors.email)} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Phone</label>
                <input name="phone" value={form.phone} onChange={onChange} placeholder="9999999999" className={inputCls(false)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Specialization *</label>
                <select name="specialization" value={form.specialization} onChange={onChange} className={inputCls(errors.specialization)}>
                  <option value="">Select specialization</option>
                  {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.specialization && <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Years of Experience</label>
                <input name="experience" type="number" value={form.experience} onChange={onChange} placeholder="5" className={inputCls(false)} />
              </div>
              <div className="md:col-span-2 lg:col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">Login Password * <span className="text-gray-400 font-normal">(given to the doctor)</span></label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={onChange} placeholder="Set a secure password" className={inputCls(errors.password)} />
                    <button type="button" onClick={() => setShowPassword(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword
                        ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      }
                    </button>
                  </div>
                  <button type="button" onClick={() => setForm(p => ({ ...p, password: generatePassword(form.name || "Doctor") }))}
                    className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-600 hover:bg-gray-200 transition whitespace-nowrap">
                    Auto-generate
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 pt-4 border-t border-gray-100">
              <button type="submit" disabled={submitting}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition">
                {submitting ? "Adding…" : "Add Doctor & Send Credentials"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY); setErrors({}); }}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, specialization or email…"
          className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-500 outline-none" />
      </div>

      {/* Doctor list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <p className="text-gray-500 font-medium">{search ? "No doctors match your search" : "No doctors added yet"}</p>
            <p className="text-gray-400 text-sm mt-1">{!search && "Click 'Add Doctor' to get started"}</p>
          </div>
        ) : filtered.map(doctor => (
          <div key={doctor.id} className={`bg-white border rounded-2xl p-5 transition ${doctor.isActive===false ? "opacity-60 border-gray-200" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-slate-600">{doctor.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{doctor.name}</p>
                    {doctor.isActive === false && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{doctor.specialization} · {doctor.experience || 0} yrs exp</p>
                  <p className="text-xs text-gray-400 mt-0.5">{doctor.email} · {doctor.phone || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Rating */}
                <div className="text-center px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-amber-600 font-bold text-sm">{doctor.rating ?? "—"} ★</p>
                  <p className="text-gray-400 text-xs">{doctor.reviews ?? 0} reviews</p>
                </div>

                <button onClick={() => handleToggleStatus(doctor)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${doctor.isActive===false ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"}`}>
                  {doctor.isActive===false ? "Reactivate" : "Deactivate"}
                </button>

                <button onClick={() => setConfirmDelete(doctor)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition">
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Remove {confirmDelete.name}?</h3>
            <p className="text-gray-500 text-sm mt-2">This will permanently delete the doctor and all their appointment records. This action cannot be undone.</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm transition">
                Yes, Remove
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
