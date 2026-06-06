import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Rating from "../../components/Rating";

export default function Ratings() {
	const { user } = useAuth();
	const [pending, setPending] = useState([]);
	const [submitted, setSubmitted] = useState([]);
	const [formState, setFormState] = useState({});

	const loadRatings = useCallback(async () => {
		if (!user) return;
		const [appointments, ratings] = await Promise.all([
			api.getAppointmentsForPatient(user.id),
			api.getRatingsByPatient(user.id),
		]);
		setPending(
			appointments.filter((appointment) => appointment.status === "completed" && !appointment.rated),
		);
		setSubmitted(ratings);
	}, [user]);

	useEffect(() => {
		loadRatings();
	}, [loadRatings]);

	const setValue = (appointmentId, key, value) => {
		setFormState((previous) => ({
			...previous,
			[appointmentId]: {
				score: 5,
				comment: "",
				...previous[appointmentId],
				[key]: value,
			},
		}));
	};

	const submit = async (appointmentId) => {
		const payload = formState[appointmentId] ?? { score: 5, comment: "" };
		await api.submitRating({
			appointmentId,
			patientId: user.id,
			score: Number(payload.score),
			comment: payload.comment,
		});
		await loadRatings();
	};

	return (
		<div>
			<h1 className="text-2xl font-bold text-gray-900">Ratings</h1>
			<p className="text-sm text-gray-600">Rate doctors after completed appointments.</p>

			<h2 className="mt-6 text-lg font-semibold text-gray-900">Pending Ratings</h2>
			<div className="mt-3 space-y-3">
				{pending.length ? (
					pending.map((appointment) => {
						const state = formState[appointment.id] ?? { score: 5, comment: "" };
						return (
							<div key={appointment.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
								<h3 className="font-semibold text-gray-900">{appointment.doctorName}</h3>
								<p className="text-sm text-gray-600">
									{appointment.specialization} • {appointment.date} {appointment.time}
								</p>

								<label className="mt-3 block text-sm font-medium text-gray-700">Score</label>
								<select
									value={state.score}
									onChange={(event) => setValue(appointment.id, "score", event.target.value)}
									className="mt-1 w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
								>
									{[1, 2, 3, 4, 5].map((score) => (
										<option key={score} value={score}>
											{score}
										</option>
									))}
								</select>

								<label className="mt-3 block text-sm font-medium text-gray-700">Comment</label>
								<textarea
									value={state.comment}
									onChange={(event) => setValue(appointment.id, "comment", event.target.value)}
									rows={3}
									className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
								/>

								<button
									onClick={() => submit(appointment.id)}
									className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
								>
									Submit Rating
								</button>
							</div>
						);
					})
				) : (
					<p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
						No pending ratings.
					</p>
				)}
			</div>

			<h2 className="mt-8 text-lg font-semibold text-gray-900">Submitted Ratings</h2>
			<div className="mt-3 space-y-3">
				{submitted.length ? (
					submitted.map((rating) => (
						<div key={rating.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<h3 className="font-semibold text-gray-900">{rating.doctorName}</h3>
								<Rating value={rating.score} />
							</div>
							<p className="mt-2 text-sm text-gray-600">{rating.comment || "No comment"}</p>
						</div>
					))
				) : (
					<p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
						No submitted ratings yet.
					</p>
				)}
			</div>
		</div>
	);
}
