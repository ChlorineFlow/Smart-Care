const statusClasses = {
  booked:    "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AppointmentCard({
  appointment,
  onCancel,
  onComplete,
  onReschedule,
  canCancel    = false,
  canComplete  = false,
  canReschedule = false,
}) {
  const badgeClass = statusClasses[appointment.status] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{appointment.doctorName}</h3>
          <p className="text-sm text-gray-600">{appointment.specialization}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badgeClass}`}>
          {appointment.status}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-gray-700 md:grid-cols-2">
        <p><span className="font-medium">Patient:</span> {appointment.patientName}</p>
        <p><span className="font-medium">Date:</span> {appointment.date}</p>
        <p><span className="font-medium">Time:</span> {appointment.time}</p>
        <p><span className="font-medium">Doctor:</span> {appointment.doctorName}</p>
      </div>

      {appointment.status === "booked" && (canCancel || canComplete || canReschedule) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {canComplete && (
            <button onClick={() => onComplete?.(appointment.id)}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition">
              Mark Completed
            </button>
          )}
          {canReschedule && (
            <button onClick={() => onReschedule?.(appointment)}
              className="rounded-lg bg-blue-50 border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition">
              Reschedule
            </button>
          )}
          {canCancel && (
            <button onClick={() => onCancel?.(appointment.id)}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition">
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}