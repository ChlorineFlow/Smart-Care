import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function DoctorDashboard() {
	const { user } = useAuth();
	const [appointments, setAppointments] = useState([]);
	const [ratings, setRatings] = useState([]);

	useEffect(() => {
		if (!user) return;
		let mounted = true;
		const load = async () => {
			const [appointmentsData, ratingsData] = await Promise.all([
				api.getAppointmentsForDoctor(user.id),
				api.getRatingsForDoctor(user.id),
			]);
			if (!mounted) return;
			setAppointments(appointmentsData);
			setRatings(ratingsData);
		};
		load();
		return () => {
			mounted = false;
		};
	}, [user]);

	const totalScore = ratings.reduce((sum, rating) => sum + rating.score, 0);
	const averageRating = ratings.length ? (totalScore / ratings.length).toFixed(1) : "0.0";

	return (
		<div>
			<h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
			<p className="text-sm text-gray-600">Track your appointments and patient feedback.</p>

			<div className="mt-6 grid gap-4 md:grid-cols-3">
				<div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
					<p className="text-xs text-gray-500">Total Appointments</p>
					<p className="mt-1 text-2xl font-bold">{appointments.length}</p>
				</div>
				<div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
					<p className="text-xs text-gray-500">Pending Today</p>
					<p className="mt-1 text-2xl font-bold text-green-700">
						{appointments.filter((appointment) => appointment.status === "booked").length}
					</p>
				</div>
				<div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
					<p className="text-xs text-gray-500">Average Rating</p>
					<p className="mt-1 text-2xl font-bold text-yellow-600">⭐ {averageRating}</p>
				</div>
			</div>
		</div>
	);
}
