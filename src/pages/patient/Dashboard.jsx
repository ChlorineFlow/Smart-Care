import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AppointmentCard from "../../components/AppointmentCard";

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      await api.deletePatient(user.id);
      logout();
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const load = async () => {
      const data = await api.getAppointmentsForPatient(user.id);
      if (mounted) setAppointments(data);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const upcoming = appointments.filter(
    (appointment) => appointment.status === "booked",
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
      <p className="text-sm text-gray-600">
        Track upcoming visits and your booking activity.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Total Appointments</p>
          <p className="mt-1 text-2xl font-bold">{appointments.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Upcoming</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">
            {upcoming.length}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="mt-1 text-2xl font-bold text-green-700">
            {
              appointments.filter(
                (appointment) => appointment.status === "completed",
              ).length
            }
          </p>
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold text-gray-900">
        Upcoming Appointments
      </h2>
      <div className="space-y-3">
        {upcoming.length ? (
          upcoming
            .slice(0, 3)
            .map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
        ) : (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
            No upcoming appointment. Book one from Book Appointment.
          </p>
        )}
      </div>

      {/* Delete Account */}
      <div className="mt-10 border border-red-200 rounded-2xl p-5 bg-red-50">
        <h3 className="text-sm font-bold text-red-700 mb-1">Danger Zone</h3>
        <p className="text-xs text-red-500 mb-4">
          Permanently delete your account and all appointment history. This
          cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition"
        >
          Delete My Account
        </button>
      </div>

      {/* Confirm delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Delete your account?
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              All your appointments and data will be permanently deleted. You
              cannot undo this.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm transition"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}