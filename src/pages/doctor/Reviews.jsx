import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Rating from "../../components/Rating";

export default function Reviews() {
	const { user } = useAuth();
	const [ratings, setRatings] = useState([]);

	useEffect(() => {
		if (!user) return;
		let mounted = true;
		const load = async () => {
			const data = await api.getRatingsForDoctor(user.id);
			if (mounted) setRatings(data);
		};
		load();
		return () => {
			mounted = false;
		};
	}, [user]);

	return (
		<div>
			<h1 className="text-2xl font-bold text-gray-900">Patient Reviews</h1>
			<p className="text-sm text-gray-600">Feedback shared by your patients.</p>

			<div className="mt-6 space-y-3">
				{ratings.length ? (
					ratings.map((rating) => (
						<div key={rating.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<p className="font-semibold text-gray-900">{rating.patientName}</p>
								<Rating value={rating.score} />
							</div>
							<p className="mt-2 text-sm text-gray-600">{rating.comment || "No comment"}</p>
							<p className="mt-2 text-xs text-gray-400">{new Date(rating.createdAt).toLocaleString()}</p>
						</div>
					))
				) : (
					<p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
						No reviews yet.
					</p>
				)}
			</div>
		</div>
	);
}
