import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.getPrescriptions({ patientId: user.id })
      .then(data => setPrescriptions(data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [user]);

  const formatSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
        <p className="text-gray-500 text-sm mt-0.5">Download prescriptions uploaded by your doctors.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-14 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-gray-600 font-semibold">No prescriptions yet</p>
          <p className="text-gray-400 text-sm mt-1">Your doctor will upload prescriptions here after your appointment.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {prescriptions.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-4">
                {/* PDF icon */}
                <div className="w-12 h-14 bg-red-100 border border-red-200 rounded-xl flex flex-col items-center justify-center shrink-0">
                  <span className="text-red-600 text-xs font-extrabold">PDF</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{p.fileName}</p>
                  <p className="text-blue-600 text-sm font-medium mt-0.5">{p.doctorName}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}{formatSize(p.fileSize)}
                  </p>
                </div>
              </div>

              <a href={api.downloadPrescription(p.id)}
                target="_blank" rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Download Prescription
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}