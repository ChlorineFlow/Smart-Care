import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AppointmentCard from "../../components/AppointmentCard";

export default function History() {
	const { user } = useAuth();
	const [appointments, setAppointments] = useState([]);

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

	const handleCancel = async (appointmentId) => {
		await api.updateAppointmentStatus(appointmentId, "cancelled");
		setAppointments(await api.getAppointmentsForPatient(user.id));
	};

	return (
		<div>
			<h1 className="text-2xl font-bold text-gray-900">Appointment History</h1>
			<p className="text-sm text-gray-600">View all your bookings and status updates.</p>

			<div className="mt-6 space-y-3">
				{appointments.length ? (
					appointments.map((appointment) => (
						<AppointmentCard
							key={appointment.id}
							appointment={appointment}
							canCancel
							onCancel={handleCancel}
						/>
					))
				) : (
					<p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
						No appointments yet.
					</p>
				)}
			</div>
		</div>
	);
}
