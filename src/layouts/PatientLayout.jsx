import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { SIDEBAR_LINKS } from "../utils/constants";

export default function PatientLayout() {
	return (
		<div className="min-h-screen bg-gray-50 md:flex">
			<Sidebar role="patient" links={SIDEBAR_LINKS.patient} />
			<main className="flex-1 p-6 md:p-8">
				<Outlet />
			</main>
		</div>
	);
}
