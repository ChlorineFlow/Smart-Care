import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const fileRef = useRef();

  const [appointments, setAppointments]   = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedAppt, setSelectedAppt]  = useState(null);
  const [file, setFile]                  = useState(null);
  const [uploading, setUploading]        = useState(false);
  const [toast, setToast]                = useState(null);
  const [search, setSearch]              = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    if (!user) return;
    const [appts, presc] = await Promise.all([
      api.getAppointmentsForDoctor(user.id),
      api.getPrescriptions({ doctorId: user.id }),
    ]);
    // Only completed appointments
    setAppointments(appts.filter(a => a.status === "completed"));
    setPrescriptions(presc);
  };

  useEffect(() => { load(); }, [user]);

  const hasPrescription = (appointmentId) =>
    prescriptions.some(p => p.appointmentId === appointmentId);

  const getPrescription = (appointmentId) =>
    prescriptions.find(p => p.appointmentId === appointmentId);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      showToast("Only PDF files are allowed.", "error"); return;
    }
    if (f.size > 5 * 1024 * 1024) {
      showToast("File must be under 5MB.", "error"); return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!selectedAppt || !file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          await api.uploadPrescription({
            appointmentId: selectedAppt.id,
            doctorId:      user.id,
            patientId:     selectedAppt.patientId,
            fileName:      file.name,
            fileData:      e.target.result,
          });
          showToast(`Prescription uploaded for ${selectedAppt.patientName}`);
          setSelectedAppt(null);
          setFile(null);
          if (fileRef.current) fileRef.current.value = "";
          await load();
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showToast(err.message, "error");
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1024/1024).toFixed(1)} MB`;
  };

  const filtered = appointments.filter(a =>
    a.patientName.toLowerCase().includes(search.toLowerCase()) ||
    a.date.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 max-w-sm px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3 text-white ${toast.type==="error" ? "bg-red-600" : "bg-slate-800"}`}>
          {toast.type === "error"
            ? <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            : <svg className="w-5 h-5 mt-0.5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          }
          <p className="text-sm">{toast.msg}</p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
        <p className="text-gray-500 text-sm mt-0.5">Upload prescriptions for completed appointments.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Left — appointment list */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 text-sm">Completed Appointments</h2>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search patient or date…"
              className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>

          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-gray-400 text-sm">No completed appointments yet</p>
              </div>
            ) : filtered.map(appt => {
              const hasP   = hasPrescription(appt.id);
              const isSel  = selectedAppt?.id === appt.id;
              return (
                <div key={appt.id}
                  onClick={() => { setSelectedAppt(appt); setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className={`px-5 py-4 cursor-pointer transition flex items-center justify-between gap-3 ${isSel ? "bg-blue-50 border-l-4 border-blue-600" : "hover:bg-gray-50"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-blue-600 font-bold text-sm">{appt.patientName.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{appt.patientName}</p>
                      <p className="text-xs text-gray-400">{appt.date} · {appt.time}</p>
                    </div>
                  </div>
                  {hasP
                    ? <span className="shrink-0 text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">✓ Uploaded</span>
                    : <span className="shrink-0 text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold">Pending</span>
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — upload panel */}
        <div className="space-y-4">
          {!selectedAppt ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <p className="text-gray-500 font-medium text-sm">Select an appointment</p>
              <p className="text-gray-400 text-xs mt-1">Click any completed appointment to upload a prescription</p>
            </div>
          ) : (
            <>
              {/* Selected appointment info */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">Upload Prescription</h3>
                  <button onClick={() => { setSelectedAppt(null); setFile(null); }}
                    className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
                  <p className="text-blue-800 text-sm font-semibold">{selectedAppt.patientName}</p>
                  <p className="text-blue-500 text-xs">{selectedAppt.date} at {selectedAppt.time}</p>
                </div>

                {/* File drop zone */}
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${file ? "border-emerald-400 bg-emerald-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}>
                  <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden"/>
                  {file ? (
                    <>
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      </div>
                      <p className="text-emerald-700 font-semibold text-sm">{file.name}</p>
                      <p className="text-emerald-500 text-xs mt-1">{formatSize(file.size)} · Click to change</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                      </div>
                      <p className="text-gray-600 font-semibold text-sm">Click to upload PDF</p>
                      <p className="text-gray-400 text-xs mt-1">PDF only · Max 5MB</p>
                    </>
                  )}
                </div>

                <button onClick={handleUpload} disabled={!file || uploading}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition">
                  {uploading ? "Uploading…" : "Upload Prescription"}
                </button>
              </div>

              {/* Already uploaded? Show it */}
              {hasPrescription(selectedAppt.id) && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-800 font-bold text-sm">✓ Prescription on file</p>
                      <p className="text-emerald-600 text-xs mt-0.5">
                        {getPrescription(selectedAppt.id)?.fileName} · {formatSize(getPrescription(selectedAppt.id)?.fileSize)}
                      </p>
                    </div>
                    <a href={api.downloadPrescription(getPrescription(selectedAppt.id)?.id)}
                      target="_blank" rel="noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition">
                      Download
                    </a>
                  </div>
                  <p className="text-emerald-500 text-xs mt-2">Uploading a new file will replace the existing prescription.</p>
                </div>
              )}
            </>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{prescriptions.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Prescriptions Uploaded</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-amber-600">
                {appointments.length - prescriptions.length < 0 ? 0 : appointments.length - prescriptions.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Pending Upload</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}