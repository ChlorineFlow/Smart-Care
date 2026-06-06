import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminDashboard() {
	const [stats, setStats] = useState(null);
	const [appointments, setAppointments] = useState([]);

	useEffect(() => {
		let mounted = true;
		const load = async () => {
			const [statsData, appointmentsData] = await Promise.all([
				api.getAdminStats(),
				api.getAllAppointments(),
			]);
			if (!mounted) return;
			setStats(statsData);
			setAppointments(appointmentsData.slice(0, 6));
		};
		load();
		return () => {
			mounted = false;
		};
	}, []);

	if (!stats) return null;

	return (
		<div>
			<h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
			<p className="text-sm text-gray-600">Overview of platform activity and utilization.</p>

			<div className="mt-6 grid gap-4 md:grid-cols-4">
				<StatCard title="Patients" value={stats.totalPatients} />
				<StatCard title="Doctors" value={stats.totalDoctors} />
				<StatCard title="Appointments" value={stats.totalAppointments} />
				<StatCard title="Ratings" value={stats.totalRatings} />
			</div>

			<h2 className="mt-8 text-lg font-semibold text-gray-900">Recent Appointments</h2>
			<div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
				<table className="min-w-full text-sm">
					<thead className="bg-gray-100 text-left text-gray-700">
						<tr>
							<th className="px-4 py-3">Patient</th>
							<th className="px-4 py-3">Doctor</th>
							<th className="px-4 py-3">Date</th>
							<th className="px-4 py-3">Status</th>
						</tr>
					</thead>
					<tbody>
						{appointments.map((appointment) => (
							<tr key={appointment.id} className="border-t border-gray-100">
								<td className="px-4 py-3">{appointment.patientName}</td>
								<td className="px-4 py-3">{appointment.doctorName}</td>
								<td className="px-4 py-3">
									{appointment.date} {appointment.time}
								</td>
								<td className="px-4 py-3 capitalize">{appointment.status}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function StatCard({ title, value }) {
	return (
		<div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
			<p className="text-xs text-gray-500">{title}</p>
			<p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
		</div>
	);
}
