export default function DoctorCard({ doctor, onBook, actionLabel = "Book" }) {
	return (
		<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
					<p className="text-sm text-gray-600">{doctor.specialization}</p>
					<p className="mt-1 text-xs text-gray-500">{doctor.experience} years experience</p>
				</div>
				<div className="rounded-lg bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
					⭐ {doctor.rating || 0} ({doctor.reviews || 0})
				</div>
			</div>

			<div className="mt-4 flex flex-wrap gap-2">
				{(doctor.slots ?? []).map((slot) => (
					<span key={slot} className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700">
						{slot}
					</span>
				))}
			</div>

			{onBook ? (
				<button
					onClick={() => onBook(doctor)}
					className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
				>
					{actionLabel}
				</button>
			) : null}
		</div>
	);
}
