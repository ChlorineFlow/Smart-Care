import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { SIDEBAR_LINKS } from "../utils/constants";

export default function DoctorLayout() {
	return (
		<div className="min-h-screen bg-gray-50 md:flex">
			<Sidebar role="doctor" links={SIDEBAR_LINKS.doctor} />
			<main className="flex-1 p-6 md:p-8">
				<Outlet />
			</main>
		</div>
	);
}
