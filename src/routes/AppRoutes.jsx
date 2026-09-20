import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Landing from "../pages/Landing";
import SelectRole from "../pages/auth/SelectRole";
import ManagePatients from "../pages/admin/ManagePatients";
import DoctorAvailability from "../pages/doctor/Availability";
import DoctorAnalytics from "../pages/doctor/Analytics";
import PatientSignup from "../pages/auth/PatientSignup";
import PatientLogin from "../pages/auth/PatientLogin";
import DoctorLogin from "../pages/auth/DoctorLogin";
import AdminLogin from "../pages/auth/AdminLogin";
import DoctorSignup from "../pages/auth/DoctorSignup";
import SelectRoleLogin from "../pages/auth/SelectRoleLogin";
import PatientLayout from "../layouts/PatientLayout";
import DoctorLayout from "../layouts/DoctorLayout";
import AdminLayout from "../layouts/AdminLayout";
import PatientDashboard from "../pages/patient/Dashboard";
import BookAppointment from "../pages/patient/BookAppointment";
import History from "../pages/patient/History";
import Ratings from "../pages/patient/Ratings";
import DoctorDashboard from "../pages/doctor/Dashboard";
import Appointments from "../pages/doctor/Appointments";
import Reviews from "../pages/doctor/Reviews";
import AdminDashboard from "../pages/admin/Dashboard";
import ManageDoctors from "../pages/admin/ManageDoctors";
import ManageSlots from "../pages/admin/ManageSlots";
import Analytics from "../pages/admin/Analytics";
import { useAuth } from "../context/AuthContext";
import DoctorPrescriptions from "../pages/doctor/Prescriptions";
import PatientPrescriptions from "../pages/patient/Prescriptions";

function ProtectedRoute({ role }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/select-role-login" replace />;
  }

  if (user?.role !== role) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/select-role" element={<SelectRole />} />
        <Route path="/patient-signup" element={<PatientSignup />} />
        <Route path="/patient-login" element={<PatientLogin />} />
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/doctor-signup" element={<DoctorSignup />} />
        <Route path="/select-role-login" element={<SelectRoleLogin />} />

        <Route element={<ProtectedRoute role="patient" />}>
          <Route path="/patient" element={<PatientLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="prescriptions" element={<PatientPrescriptions />} />
            <Route path="book" element={<BookAppointment />} />
            <Route path="history" element={<History />} />
            <Route path="ratings" element={<Ratings />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="doctor" />}>
          <Route path="/doctor" element={<DoctorLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="prescriptions" element={<DoctorPrescriptions />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="analytics" element={<DoctorAnalytics />} />
            <Route path="availability" element={<DoctorAvailability />} />
            <Route path="reviews" element={<Reviews />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="manage-doctors" element={<ManageDoctors />} />
            <Route path="manage-patients" element={<ManagePatients />} />
            <Route path="manage-slots" element={<ManageSlots />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}