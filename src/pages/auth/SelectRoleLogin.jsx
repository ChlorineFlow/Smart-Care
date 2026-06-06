import { useNavigate } from "react-router-dom";

const roles = [
  { title:"Patient", desc:"Access your appointments and health records", icon:"🧑‍⚕️", route:"/patient-login", color:"from-blue-600 to-blue-700", ring:"hover:ring-blue-500/30" },
  { title:"Doctor", desc:"View your schedule and manage appointments", icon:"👨‍⚕️", route:"/doctor-login", color:"from-emerald-600 to-emerald-700", ring:"hover:ring-emerald-500/30" },
  { title:"Admin", desc:"Manage the SmartCare administration panel", icon:"🛡️", route:"/admin-login", color:"from-slate-700 to-slate-800", ring:"hover:ring-slate-500/30" },
];

export default function SelectRoleLogin() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/60 text-sm">Welcome back</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Sign In to SmartCare</h1>
          <p className="text-white/50">Select your role to continue</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {roles.map(role => (
            <button key={role.title} onClick={() => navigate(role.route)}
              className={`group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-7 text-left transition-all duration-300 hover:-translate-y-1 ring-1 ring-transparent ${role.ring}`}>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                {role.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{role.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{role.desc}</p>
              <div className="mt-5 flex items-center gap-1 text-white/40 group-hover:text-white/70 transition text-sm font-medium">
                Sign in <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-white/40 text-sm mt-10">
          New to SmartCare?{" "}
          <button onClick={() => navigate("/select-role")} className="text-white/70 font-semibold hover:text-white underline underline-offset-2">Create an account</button>
        </p>
      </div>
    </div>
  );
}
