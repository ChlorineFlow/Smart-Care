import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

export default function Analytics() {
	const [appointments, setAppointments] = useState([]);

	useEffect(() => {
		let mounted = true;
		const load = async () => {
			const data = await api.getAllAppointments();
			if (mounted) setAppointments(data);
		};
		load();
		return () => {
			mounted = false;
		};
	}, []);

	const statusCounts = useMemo(
		() => ({
			booked: appointments.filter((appointment) => appointment.status === "booked").length,
			completed: appointments.filter((appointment) => appointment.status === "completed").length,
			cancelled: appointments.filter((appointment) => appointment.status === "cancelled").length,
		}),
		[appointments],
	);

	const doctorCounts = useMemo(() => {
		const counts = {};
		appointments.forEach((appointment) => {
			counts[appointment.doctorName] = (counts[appointment.doctorName] ?? 0) + 1;
		});
		return Object.entries(counts).sort((a, b) => b[1] - a[1]);
	}, [appointments]);

	return (
		<div>
			<h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
			<p className="text-sm text-gray-600">Quick insights into appointment and doctor usage.</p>

			<div className="mt-6 grid gap-4 md:grid-cols-3">
				<Metric title="Booked" value={statusCounts.booked} className="text-blue-700" />
				<Metric title="Completed" value={statusCounts.completed} className="text-green-700" />
				<Metric title="Cancelled" value={statusCounts.cancelled} className="text-red-700" />
			</div>

			<h2 className="mt-8 text-lg font-semibold text-gray-900">Appointments by Doctor</h2>
			<div className="mt-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
				{doctorCounts.length ? (
					<div className="space-y-3">
						{doctorCounts.map(([doctorName, count]) => (
							<div key={doctorName}>
								<div className="mb-1 flex justify-between text-sm">
									<span className="text-gray-700">{doctorName}</span>
									<span className="font-medium text-gray-900">{count}</span>
								</div>
								<div className="h-2 w-full rounded-full bg-gray-200">
									<div
										className="h-2 rounded-full bg-gray-900"
										style={{ width: `${(count / Math.max(appointments.length, 1)) * 100}%` }}
									/>
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="text-sm text-gray-500">No analytics available yet.</p>
				)}
			</div>
		</div>
	);
}

function Metric({ title, value, className }) {
	return (
		<div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
			<p className="text-xs text-gray-500">{title}</p>
			<p className={`mt-1 text-2xl font-bold ${className}`}>{value}</p>
		</div>
	);
}
