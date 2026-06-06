import { useNavigate } from "react-router-dom";

const roles = [
  { title:"Patient", desc:"Book appointments and manage your health records", icon:"🧑‍⚕️", route:"/patient-signup", color:"from-blue-600 to-blue-700", ring:"ring-blue-500/30", badge:"New account" },
  { title:"Doctor", desc:"Your account is set up by the SmartCare admin", icon:"👨‍⚕️", route:"/doctor-login", color:"from-emerald-600 to-emerald-700", ring:"ring-emerald-500/30", badge:"Admin-assigned" },
  { title:"Admin", desc:"Manage the SmartCare platform and doctor accounts", icon:"🛡️", route:"/admin-login", color:"from-slate-700 to-slate-800", ring:"ring-slate-500/30", badge:"Restricted" },
];

export default function SelectRole() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-white/60 text-sm">Getting started</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Join SmartCare</h1>
          <p className="text-white/50">Choose your role to create or access your account</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {roles.map(role => (
            <button key={role.title} onClick={() => navigate(role.route)}
              className={`group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-7 text-left transition-all duration-300 hover:-translate-y-1 ring-1 ring-transparent hover:${role.ring}`}>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                {role.icon}
              </div>
              <span className="inline-block text-xs font-medium bg-white/10 text-white/60 px-2.5 py-1 rounded-full mb-3">{role.badge}</span>
              <h3 className="text-xl font-bold text-white mb-2">{role.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{role.desc}</p>
              <div className="mt-5 flex items-center gap-1 text-white/40 group-hover:text-white/70 transition text-sm font-medium">
                Continue <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-white/40 text-sm mt-10">
          Already have an account?{" "}
          <button onClick={() => navigate("/select-role-login")} className="text-white/70 font-semibold hover:text-white underline underline-offset-2">Sign in</button>
        </p>
      </div>
    </div>
  );
}
