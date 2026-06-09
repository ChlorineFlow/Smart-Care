export const STORAGE_KEYS = {
	DB: "smartcare_db",
	SESSION: "smartcare_session",
};

export const ROLE_LABELS = {
	patient: "Patient",
	doctor: "Doctor",
	admin: "Admin",
};

export const SIDEBAR_LINKS = {
	patient: [
		{ label: "Dashboard", to: "/patient/dashboard" },
		{ label: "Book Appointment", to: "/patient/book" },
		{ label: "History", to: "/patient/history" },
		{ label: "Ratings", to: "/patient/ratings" },
	],
	doctor: [
		{ label: "Dashboard", to: "/doctor/dashboard" },
		{ label: "Appointments", to: "/doctor/appointments" },
		{ label: "Analytics",   to: "/doctor/analytics" },
		{ label: "Availability", to: "/doctor/availability" },
		{ label: "Reviews", to: "/doctor/reviews" },
	],
	admin: [
		{ label: "Dashboard", to: "/admin/dashboard" },
		{ label: "Manage Doctors", to: "/admin/manage-doctors" },
		{ label: "Manage Patients", to: "/admin/manage-patients" },
		{ label: "Manage Slots", to: "/admin/manage-slots" },
		{ label: "Analytics", to: "/admin/analytics" },
	],
};

export const ROLE_ACCENT_CLASSES = {
	patient: "text-blue-700 bg-blue-100 border-blue-200",
	doctor: "text-green-700 bg-green-100 border-green-200",
	admin: "text-gray-800 bg-gray-200 border-gray-300",
};

export const DEFAULT_DOCTOR_SLOTS = ["09:00", "11:00", "14:00", "16:00"];
