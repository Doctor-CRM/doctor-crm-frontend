import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { adminService } from "../service/adminService";
import { getApiErrorMessage } from "../service/api";
import "./PatientDashboard.css";
import logoImg from "../assets/Hospital CRM Healthcare Logo (1).png";
import type { DoctorProfile } from "../types/admin";

interface Appointment {
  id: string;
  doctorName: string;
  speciality: string;
  date: string;
  time: string;
  status: "Confirmed" | "Pending" | "Completed";
  location: string;
}

interface Prescription {
  id: string;
  doctorName: string;
  date: string;
  medicines: string;
  dosage: string;
}

export const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"appointments" | "book" | "prescriptions" | "doctors">("appointments");

  // Dynamic API Doctors List
  const [doctorsList, setDoctorsList] = useState<DoctorProfile[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState<boolean>(false);

  // Dynamic Patient Appointments & Prescriptions (NO HARDCODED DUMMY DATA)
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions] = useState<Prescription[]>([]);

  // Booking Form State
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  const fetchDoctors = useCallback(async () => {
    setIsLoadingDoctors(true);
    try {
      const data = await adminService.getDoctorData();
      setDoctorsList(data || []);
    } catch (err) {
      console.warn("Failed to fetch doctors list:", getApiErrorMessage(err));
    } finally {
      setIsLoadingDoctors(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !appointmentDate || !appointmentTime) return;

    const newApt: Appointment = {
      id: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
      doctorName: selectedDoctor,
      speciality: "Specialist",
      date: appointmentDate,
      time: appointmentTime,
      status: "Confirmed",
      location: "Main OPD Wing",
    };

    setAppointments([newApt, ...appointments]);
    setBookingSuccess("Your appointment has been successfully booked!");

    setTimeout(() => {
      setBookingSuccess("");
      setSelectedDoctor("");
      setAppointmentDate("");
      setAppointmentTime("");
      setReason("");
      setActiveTab("appointments");
    }, 2000);
  };

  return (
    <div className="dashboard-layout patient-theme">
      {/* Top Navbar */}
      <header className="dashboard-header">
        <div className="brand-section">
          <img src={logoImg} alt="Hospital CRM Logo" style={{ height: "38px", width: "auto", objectFit: "contain", borderRadius: "6px" }} />
          <div className="brand-badge patient-badge">🏥 Patient Portal</div>
          <h2>Hospital CRM</h2>
        </div>

        <div className="user-profile-section">
          <div className="emergency-call-badge">
            🚨 Helpline: <strong>1800-123-9999</strong>
          </div>

          <div className="profile-info">
            <span className="profile-name">{user?.name || user?.username || "Patient Account"}</span>
            <span className="profile-role">Patient</span>
          </div>

          <button onClick={handleLogout} className="dashboard-logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Navigation Sidebar */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-menu">
            <button
              className={`menu-item ${activeTab === "appointments" ? "active" : ""}`}
              onClick={() => setActiveTab("appointments")}
            >
              📅 My Appointments ({appointments.length})
            </button>
            <button
              className={`menu-item ${activeTab === "book" ? "active" : ""}`}
              onClick={() => setActiveTab("book")}
            >
              ➕ Book New Appointment
            </button>
            <button
              className={`menu-item ${activeTab === "prescriptions" ? "active" : ""}`}
              onClick={() => setActiveTab("prescriptions")}
            >
              💊 My Prescriptions ({prescriptions.length})
            </button>
            <button
              className={`menu-item ${activeTab === "doctors" ? "active" : ""}`}
              onClick={() => setActiveTab("doctors")}
            >
              👨‍⚕️ Available Doctors ({doctorsList.length})
            </button>
          </nav>

          <div className="quick-stats-box">
            <h4>Health Summary</h4>
            <div className="stat-mini">
              <span>Active Bookings:</span>
              <strong>{appointments.filter((a) => a.status === "Confirmed").length}</strong>
            </div>
            <div className="stat-mini">
              <span>Prescriptions:</span>
              <strong>{prescriptions.length}</strong>
            </div>
          </div>
        </aside>

        {/* Main Workspace Content */}
        <main className="dashboard-main">
          {/* Top Metrics Cards */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <h3>{appointments.length}</h3>
                <p>Total Booked Appointments</p>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">💊</div>
              <div className="stat-content">
                <h3>{prescriptions.length}</h3>
                <p>Digital Prescriptions</p>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-content">
                <h3>{doctorsList.length}</h3>
                <p>Hospital Doctors Available</p>
              </div>
            </div>
          </div>

          {/* Tab 1: My Appointments */}
          {activeTab === "appointments" && (
            <section className="dashboard-section">
              <div className="section-header">
                <h3>My Appointments Schedule</h3>
                <button
                  className="submit-presc-btn"
                  onClick={() => setActiveTab("book")}
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  + Book Appointment
                </button>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Booking Ref</th>
                      <th>Doctor Name</th>
                      <th>Speciality</th>
                      <th>Date</th>
                      <th>Time Slot</th>
                      <th>Clinic Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty-state">
                          No upcoming appointments booked yet.
                        </td>
                      </tr>
                    ) : (
                      appointments.map((apt) => (
                        <tr key={apt.id}>
                          <td><strong>{apt.id}</strong></td>
                          <td>{apt.doctorName}</td>
                          <td>
                            <span className="pill-tag role-doctor">
                              {apt.speciality}
                            </span>
                          </td>
                          <td>{apt.date}</td>
                          <td>{apt.time}</td>
                          <td>{apt.location}</td>
                          <td>
                            <span className={`status-tag ${apt.status.toLowerCase()}`}>
                              {apt.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Tab 2: Book New Appointment */}
          {activeTab === "book" && (
            <section className="dashboard-section form-section">
              <h3>Book OPD Appointment Slot</h3>

              {bookingSuccess && (
                <div className="alert-banner success-alert">
                  ✅ {bookingSuccess}
                </div>
              )}

              <form onSubmit={handleBookAppointment} className="prescription-form">
                <div className="form-group">
                  <label>Select Specialist Doctor</label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Doctor from Database</option>
                    {doctorsList.length === 0 ? (
                      <option value="Dr. Specialist">General OPD Practitioner</option>
                    ) : (
                      doctorsList.map((doc) => (
                        <option key={doc.id} value={doc.doctor_name}>
                          {doc.doctor_name} ({doc.doctor_type} - ₹{doc.consultation_fee})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Preferred Date</label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Time Slot</label>
                    <select
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select Time Slot</option>
                      <option value="09:30 AM">09:30 AM - Morning Slot</option>
                      <option value="11:00 AM">11:00 AM - Morning Slot</option>
                      <option value="02:30 PM">02:30 PM - Afternoon Slot</option>
                      <option value="04:30 PM">04:30 PM - Evening Slot</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Health Concern / Reason for Visit</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe your symptoms or reason for visit..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <button type="submit" className="submit-presc-btn">
                  Confirm Booking
                </button>
              </form>
            </section>
          )}

          {/* Tab 3: Prescriptions */}
          {activeTab === "prescriptions" && (
            <section className="dashboard-section">
              <div className="section-header">
                <h3>My Digital Prescriptions</h3>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rx ID</th>
                      <th>Doctor Name</th>
                      <th>Date</th>
                      <th>Prescribed Medicines</th>
                      <th>Dosage Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty-state">
                          No digital prescriptions available.
                        </td>
                      </tr>
                    ) : (
                      prescriptions.map((rx) => (
                        <tr key={rx.id}>
                          <td><strong>{rx.id}</strong></td>
                          <td>{rx.doctorName}</td>
                          <td>{rx.date}</td>
                          <td>{rx.medicines}</td>
                          <td>{rx.dosage}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Tab 4: Available Hospital Doctors */}
          {activeTab === "doctors" && (
            <section className="dashboard-section">
              <div className="section-header">
                <h3>Hospital Doctors Directory</h3>
              </div>

              {isLoadingDoctors ? (
                <div className="empty-state">Loading Doctors Directory from Database...</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Doc ID</th>
                        <th>Doctor Name</th>
                        <th>Speciality</th>
                        <th>Experience</th>
                        <th>Consultation Fee</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctorsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="empty-state">
                            No doctors registered in Database.
                          </td>
                        </tr>
                      ) : (
                        doctorsList.map((doc) => (
                          <tr key={doc.id}>
                            <td><strong>#DOC-{doc.id}</strong></td>
                            <td><strong>{doc.doctor_name}</strong></td>
                            <td>
                              <span className="pill-tag role-doctor">
                                {doc.doctor_type}
                              </span>
                            </td>
                            <td>{doc.experience_years} Years</td>
                            <td><strong>₹{doc.consultation_fee}</strong></td>
                            <td>
                              <span
                                className={`badge-availability ${
                                  doc.availability_status === "available"
                                    ? "available"
                                    : "unavailable"
                                }`}
                              >
                                {doc.availability_status.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <button
                                className="action-btn start"
                                onClick={() => {
                                  setSelectedDoctor(doc.doctor_name);
                                  setActiveTab("book");
                                }}
                              >
                                Book Now
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default PatientDashboard;
