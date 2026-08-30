const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  if (!response.ok) {
    let message = "Request failed";
    try { const b = await response.json(); message = b.message || message; } catch {}
    throw new Error(message);
  }
  if (response.status === 204 || response.headers.get("content-length") === "0") return null;
  return response.json();
};

const api = {
  // ── OTP ──────────────────────────────────────────────────────
  sendOtp(email, purpose = "signup") {
    return request("/otp/send", { method: "POST", body: JSON.stringify({ email, purpose }) });
  },
  verifyOtp(email, code, purpose = "signup") {
    return request("/otp/verify", { method: "POST", body: JSON.stringify({ email, code, purpose }) });
  },

  // ── AUTH ─────────────────────────────────────────────────────
  login(role, credentials) {
    return request("/auth/login", { method: "POST", body: JSON.stringify({ role, ...credentials }) });
  },
  patientLogin(credentials) {
    return request("/auth/patient-login", { method: "POST", body: JSON.stringify(credentials) });
  },
  patientOtpLogin(email, code) {
    return request("/auth/patient-otp-login", { method: "POST", body: JSON.stringify({ email, code }) });
  },
  registerPatient(payload) {
    return request("/auth/register/patient", { method: "POST", body: JSON.stringify(payload) });
  },

  // ── DOCTORS ──────────────────────────────────────────────────
  getDoctors() { return request("/doctors"); },
  getAllDoctors() { return request("/doctors/all"); },
  getDoctorById(id) { return request(`/doctors/${id}`); },
  addDoctor(payload) {
    return request("/doctors", { method: "POST", body: JSON.stringify(payload) });
  },
  removeDoctor(id) { return request(`/doctors/${id}`, { method: "DELETE" }); },
  updateDoctorSlots(id, slots) {
    return request(`/doctors/${id}/slots`, { method: "PUT", body: JSON.stringify({ slots }) });
  },
  toggleDoctorStatus(id, is_active) {
    return request(`/doctors/${id}/status`, { method: "PATCH", body: JSON.stringify({ is_active }) });
  },

  // ── APPOINTMENTS ─────────────────────────────────────────────
  bookAppointment(payload) {
    return request("/appointments", { method: "POST", body: JSON.stringify(payload) });
  },
  getAppointmentsForPatient(patientId) {
    return request(`/appointments?patientId=${encodeURIComponent(patientId)}`);
  },
  getAppointmentsForDoctor(doctorId) {
    return request(`/appointments?doctorId=${encodeURIComponent(doctorId)}`);
  },
  getAllAppointments() { return request("/appointments"); },
  updateAppointmentStatus(id, status) {
    return request(`/appointments/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  },
  rescheduleAppointment(id, date, time) {
  return request(`/appointments/${id}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify({ date, time }),
  });
},

  // ── RATINGS ──────────────────────────────────────────────────
  submitRating(payload) {
    return request("/ratings", { method: "POST", body: JSON.stringify(payload) });
  },
  getRatingsForDoctor(doctorId) {
    return request(`/ratings?doctorId=${encodeURIComponent(doctorId)}`);
  },
  getRatingsByPatient(patientId) {
    return request(`/ratings?patientId=${encodeURIComponent(patientId)}`);
  },

  // ── ADMIN ────────────────────────────────────────────────────
getAdminStats() { return request("/admin/stats"); },

getDoctorAnalytics(id) { return request(`/doctors/${id}/analytics`); },

// ── PRESCRIPTIONS ─────────────────────────────────────────────
uploadPrescription(payload) {
  return request("/prescriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
},
getPrescriptions(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/prescriptions${q ? "?" + q : ""}`);
},
downloadPrescription(id) {
  return `${API_BASE_URL}/prescriptions/${id}/download`;
},

getBlockedDates(doctorId) {
  return request(`/doctors/${doctorId}/blocked-dates`);
},
getRecurringBlocks(doctorId) {
  return request(`/doctors/${doctorId}/recurring-blocks`);
},
addRecurringBlock(doctorId, dayOfWeek, reason) {
  return request(`/doctors/${doctorId}/recurring-blocks`, {
    method: "POST",
    body: JSON.stringify({ dayOfWeek, reason }),
  });
},
removeRecurringBlock(doctorId, day) {
  return request(`/doctors/${doctorId}/recurring-blocks/${day}`, {
    method: "DELETE",
  });
},
blockDate(doctorId, date, reason) {
  return request(`/doctors/${doctorId}/blocked-dates`, {
    method: "POST",
    body: JSON.stringify({ date, reason }),
  });
},
unblockDate(doctorId, date) {
  return request(`/doctors/${doctorId}/blocked-dates/${date}`, {
    method: "DELETE",
  });
},

// ── PATIENTS ─────────────────────────────────────────────────
getPatients() { return request("/patients"); },
deletePatient(id) {
  return request(`/patients/${id}`, { method: "DELETE" });
},

};

export default api;