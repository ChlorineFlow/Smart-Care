import { useEffect, useState } from "react";
import api from "../../services/api";

export default function ManageSlots() {
	const [doctors, setDoctors] = useState([]);
	const [doctorId, setDoctorId] = useState("");
	const [slotsInput, setSlotsInput] = useState("");
	const [message, setMessage] = useState("");

	useEffect(() => {
		let mounted = true;
		const load = async () => {
			const doctorsData = await api.getDoctors();
			if (!mounted) return;
			setDoctors(doctorsData);
			if (doctorsData.length) {
				setDoctorId(doctorsData[0].id);
				setSlotsInput((doctorsData[0].slots ?? []).join(", "));
			}
		};
		load();
		return () => {
			mounted = false;
		};
	}, []);

	const saveSlots = async () => {
		if (!doctorId) return;
		try {
			await api.updateDoctorSlots(
				doctorId,
				slotsInput.split(",").map((slot) => slot.trim()),
			);
			setMessage("Slots updated.");
			setDoctors(await api.getDoctors());
		} catch (error) {
			setMessage(error.message);
		}
	};

	const handleDoctorChange = (value) => {
		setDoctorId(value);
		const doctor = doctors.find((current) => current.id === value);
		setSlotsInput((doctor?.slots ?? []).join(", "));
	};

	return (
		<div>
			<h1 className="text-2xl font-bold text-gray-900">Manage Slots</h1>
			<p className="text-sm text-gray-600">Update doctor availability in HH:MM format.</p>

			<div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
				<label className="text-sm font-medium text-gray-700">Select Doctor</label>
				<select
					value={doctorId}
					onChange={(event) => handleDoctorChange(event.target.value)}
					className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
				>
					{doctors.map((doctor) => (
						<option key={doctor.id} value={doctor.id}>
							{doctor.name} • {doctor.specialization}
						</option>
					))}
				</select>

				<label className="mt-4 block text-sm font-medium text-gray-700">Slots (comma separated)</label>
				<input
					value={slotsInput}
					onChange={(event) => setSlotsInput(event.target.value)}
					className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
					placeholder="09:00, 11:00, 14:00"
				/>

				<button
					onClick={saveSlots}
					className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
				>
					Save Slots
				</button>

				{message ? <p className="mt-3 text-sm text-gray-700">{message}</p> : null}
			</div>
		</div>
	);
}
