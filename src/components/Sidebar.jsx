import { NavLink, useNavigate } from "react-router-dom";
import { ROLE_ACCENT_CLASSES, ROLE_LABELS } from "../utils/constants";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ role, links }) {
	const navigate = useNavigate();
	const { user, logout } = useAuth();

	const roleAccent = ROLE_ACCENT_CLASSES[role] ?? ROLE_ACCENT_CLASSES.patient;
	const roleLabel = ROLE_LABELS[role] ?? "User";

	return (
		<aside className="w-full md:w-72 border-r border-gray-200 bg-white p-5 md:min-h-screen">
			<button
				onClick={() => navigate("/")}
				className="text-2xl font-bold text-blue-600 tracking-wide"
			>
				❤️ SmartCare
			</button>

			<div className={`mt-5 rounded-xl border px-3 py-2 text-sm font-medium ${roleAccent}`}>
				{roleLabel} Panel
			</div>

			<div className="mt-4 rounded-xl bg-gray-50 p-3">
				<p className="text-xs text-gray-500">Signed in as</p>
				<p className="font-semibold text-gray-800">{user?.name}</p>
			</div>

			<nav className="mt-6 space-y-2">
				{links.map((link) => (
					<NavLink
						key={link.to}
						to={link.to}
						className={({ isActive }) =>
							`block rounded-lg px-4 py-2 text-sm font-medium transition ${isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
							}`
						}
					>
						{link.label}
					</NavLink>
				))}
			</nav>

			<button
				onClick={() => {
					logout();
					navigate("/select-role-login");
				}}
				className="mt-8 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
			>
				Logout
			</button>
		</aside>
	);
}
