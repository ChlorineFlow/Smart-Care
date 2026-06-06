import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import DoctorCard from "../../components/DoctorCard";
import { useAuth } from "../../context/AuthContext";

export default function BookAppointment() {
	const { user } = useAuth();
	const [doctors, setDoctors] = useState([]);
	const [selectedDoctorId, setSelectedDoctorId] = useState("");
	const [date, setDate] = useState("");
	const [time, setTime] = useState("");
	const [message, setMessage] = useState("");

	const [searchTerm,setSearchTerm]=useState("");
	const [specializationFilter,setSpecializationFilter]=useState("all");
	const [minRatingFilter,setMinRatingFilter]=useState("0");
	const [slotFilter,setSlotFilter]=useState("all");
	const [sortBy,setSortBy]=useState("rating_desc");

	useEffect(() => {
		let mounted = true;
		const load = async () => {
			const data = await api.getDoctors();
			if (mounted) setDoctors(data);
		};
		load();
		return () => {
			mounted = false;
		};
	}, []);

	const selectedDoctor = useMemo(
		() => doctors.find((doctor) => doctor.id === selectedDoctorId),
		[doctors, selectedDoctorId],
	);
	const specializationOptions=useMemo(
		()=>{
			return Array.from(new Set(doctors.map((doctor)=>String(doctor.specialization||"").trim()).filter(Boolean),
		),).sort((a,b)=>a.localeCompare(b));
	}, [doctors]);

	const slotOptions = useMemo(() => {
		return Array.from(new Set(doctors.flatMap((doctor) =>(doctor.slots ?? []).map((slot) => String(slot).trim()).filter(Boolean),
	),),).sort((a, b) => a.localeCompare(b));
	}, [doctors]);

	const filteredDoctors = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		const minRating = Number(minRatingFilter);

		let list = doctors.filter((doctor) => {
			const name = String(doctor.name || "").toLowerCase();
			const specialization = String(doctor.specialization || "").toLowerCase();
			const rating = Number(doctor.rating || 0);
			const slots = doctor.slots ?? [];

			const matchesQuery =!query || name.includes(query) || specialization.includes(query);
			const matchesSpecialization = specializationFilter === "all" || doctor.specialization === specializationFilter;
			const matchesRating = rating >= minRating;
			const matchesSlot = slotFilter === "all" || slots.includes(slotFilter);
			return matchesQuery && matchesSpecialization && matchesRating && matchesSlot;
});

list = [...list].sort((a, b) => {
	if (sortBy === "rating_desc") return (b.rating || 0) - (a.rating || 0);
	if (sortBy === "experience_desc") return (b.experience || 0) - (a.experience || 0);
	if (sortBy === "reviews_desc") return (b.reviews || 0) - (a.reviews || 0);
	return String(a.name || "").localeCompare(String(b.name || ""));
});

return list;
}, [doctors, searchTerm, specializationFilter, minRatingFilter, slotFilter, sortBy]);

	const handleBook = async (event) => {
		event.preventDefault();
		setMessage("");

		if (!selectedDoctorId || !date || !time) {
			setMessage("Please choose doctor, date and time.");
			return;
		}

		try {
			await api.bookAppointment({ patientId: user.id, doctorId: selectedDoctorId, date, time });
			setMessage("Appointment booked successfully.");
			setDate("");
			setTime("");
			setDoctors(await api.getDoctors());
		} catch (error) {
			setMessage(error.message);
		}
	};

	return (
		<div>
			<h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
			<p className="text-sm text-gray-600">Select a doctor and reserve a slot.</p>

			<div className="mt-6 grid gap-4 lg:grid-cols-2">
				<div className="space-y-3">
					{doctors.map((doctor) => (
						<DoctorCard
							key={doctor.id}
							doctor={doctor}
							actionLabel={selectedDoctorId === doctor.id ? "Selected" : "Select Doctor"}
							onBook={(pickedDoctor) => {
								setSelectedDoctorId(pickedDoctor.id);
								setTime("");
							}}
						/>
					))}
				</div>

				<form onSubmit={handleBook} className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
					<h2 className="text-lg font-semibold text-gray-900">Booking Details</h2>

					<label className="mt-4 block text-sm font-medium text-gray-700">Selected Doctor</label>
					<input
						value={selectedDoctor ? `${selectedDoctor.name} • ${selectedDoctor.specialization}` : ""}
						readOnly
						placeholder="Choose doctor from left"
						className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
					/>

					<label className="mt-4 block text-sm font-medium text-gray-700">Appointment Date</label>
					<input
						type="date"
						value={date}
						onChange={(event) => setDate(event.target.value)}
						className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
					/>

					<label className="mt-4 block text-sm font-medium text-gray-700">Time Slot</label>
					<div className="mt-2 flex flex-wrap gap-2">
						{(selectedDoctor?.slots ?? []).map((slot) => (
							<button
								key={slot}
								type="button"
								onClick={() => setTime(slot)}
								className={`rounded-full border px-3 py-1 text-sm ${
									time === slot
										? "border-blue-600 bg-blue-600 text-white"
										: "border-gray-300 text-gray-700 hover:bg-gray-100"
								}`}
							>
								{slot}
							</button>
						))}
					</div>

					{message ? <p className="mt-4 text-sm text-gray-700">{message}</p> : null}

					<button className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
						Confirm Booking
					</button>
				</form>
			</div>
		</div>
	);
}
