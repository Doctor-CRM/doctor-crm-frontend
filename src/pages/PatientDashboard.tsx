import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import "./PatientDashboard.css";

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

  // Booking Form State
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "APT-8821",
      doctorName: "Dr. Ananya Roy",
      speciality: "Cardiologist",
      date: "Tomorrow, 07 Oct",
      time: "10:30 AM",
      status: "Confirmed",
      location: "Room 201, OPD Block A",
    },
    {
      id: "APT-7500",
      doctorName: "Dr. Rajesh Gupta",
      speciality: "General Physician",
      date: "22 Sep 2026",
      time: "04:00 PM",
      status: "Completed",
      location: "Room 104, OPD Block B",
    },
  ]);

  const [prescriptions] = useState<Prescription[]>([
    {
      id: "RX-4091",
      doctorName: "Dr. Rajesh Gupta",
      date: "22 Sep 2026",
      medicines: "Amoxicillin 500mg, Paracetamol 650mg",
      dosage: "1 tab twice daily after meals (5 days)",
    },
    {
      id: "RX-3102",
      doctorName: "Dr. Vikram Seth",
      date: "10 Aug 2026",
      medicines: "Pantoprazole 40mg",
      dosage: "1 tab daily before breakfast (14 days)",
    },
  ]);

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
          <div className="brand-badge patient-badge">🏥 Patient Portal</div>
          <h2>Doctor CRM</h2>
        </div>

        <div className="user-profile-section">
          <div className="emergency-call-badge">
            🚨 Helpline: <strong>1800-123-9999</strong>
          </div>

          <div className="profile-info">
            <span className="profile-name">
              {user?.name || user?.username || "Patient"}
            </span>
            <span className="profile-role">Registered Patient</span>
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
              📅 My Appointments
            </button>
            <button
              className={`menu-item ${activeTab === "book" ? "active" : ""}`}
              onClick={() => setActiveTab("book")}
            >
              ➕ Book Appointment
            </button>
            <button
              className={`menu-item ${activeTab === "prescriptions" ? "active" : ""}`}
              onClick={() => setActiveTab("prescriptions")}
            >
              💊 Prescriptions & Reports
            </button>
            <button
              className={`menu-item ${activeTab === "doctors" ? "active" : ""}`}
              onClick={() => setActiveTab("doctors")}
            >
              👨‍⚕️ Doctor Directory
            </button>
          </nav>

          <div className="quick-stats-box">
            <h4>Health Card</h4>
            <div className="stat-mini">
              <span>Patient ID:</span>
              <strong>PT-9941</strong>
            </div>
            <div className="stat-mini">
              <span>Blood Group:</span>
              <strong>O Positive (O+)</strong>
            </div>
          </div>
        </aside>

        {/* Main Workspace Content */}
        <main className="dashboard-main">
          {/* Top Metrics Cards */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">🗓️</div>
              <div className="stat-content">
                <h3>{appointments.filter((a) => a.status === "Confirmed").length}</h3>
                <p>Upcoming Appointments</p>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">💊</div>
              <div className="stat-content">
                <h3>{prescriptions.length}</h3>
                <p>Active Prescriptions</p>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">🩺</div>
              <div className="stat-content">
                <h3>{appointments.length}</h3>
                <p>Total Consultations</p>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">❤️</div>
              <div className="stat-content">
                <h3>Normal</h3>
                <p>Vitals Status (BP: 120/80)</p>
              </div>
            </div>
          </div>

          {/* Tab 1: My Appointments */}
          {activeTab === "appointments" && (
            <section className="dashboard-section">
              <div className="section-header">
                <h3>My Scheduled Appointments</h3>
                <button
                  className="submit-presc-btn"
                  onClick={() => setActiveTab("book")}
                >
                  + Book New Appointment
                </button>
              </div>

              <div className="appointments-cards-grid">
                {appointments.map((apt) => (
                  <div key={apt.id} className="apt-card">
                    <div className="apt-card-header">
                      <div>
                        <h4>{apt.doctorName}</h4>
                        <p className="speciality">{apt.speciality}</p>
                      </div>
                      <span className={`status-tag ${apt.status.toLowerCase()}`}>
                        {apt.status}
                      </span>
                    </div>

                    <div className="apt-card-details">
                      <div className="detail-item">
                        <span>📅 Date:</span>
                        <strong>{apt.date}</strong>
                      </div>
                      <div className="detail-item">
                        <span>⏰ Time:</span>
                        <strong>{apt.time}</strong>
                      </div>
                      <div className="detail-item">
                        <span>📍 Location:</span>
                        <strong>{apt.location}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tab 2: Book Appointment */}
          {activeTab === "book" && (
            <section className="dashboard-section form-section">
              <h3>Book a Doctor's Appointment</h3>

              {bookingSuccess && (
                <div className="alert-banner success-alert">
                  ✅ {bookingSuccess}
                </div>
              )}

              <form onSubmit={handleBookAppointment} className="prescription-form">
                <div className="form-group">
                  <label>Select Specialist / Doctor</label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    required
                  >
                    <option value="" disabled>Choose Doctor...</option>
                    <option value="Dr. Ananya Roy (Cardiologist)">Dr. Ananya Roy (Cardiologist)</option>
                    <option value="Dr. Rajesh Gupta (General Physician)">Dr. Rajesh Gupta (General Physician)</option>
                    <option value="Dr. Meera Sen (Dermatologist)">Dr. Meera Sen (Dermatologist)</option>
                    <option value="Dr. Vikram Seth (Orthopedic)">Dr. Vikram Seth (Orthopedic)</option>
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
                    <label>Preferred Time Slot</label>
                    <select
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select Time...</option>
                      <option value="09:30 AM">09:30 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                      <option value="06:00 PM">06:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Symptoms / Reason for Visit</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe your health issue..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <button type="submit" className="submit-presc-btn">
                  Confirm & Book Appointment
                </button>
              </form>
            </section>
          )}

          {/* Tab 3: Prescriptions */}
          {activeTab === "prescriptions" && (
            <section className="dashboard-section">
              <h3>My Digital Prescriptions</h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Prescription ID</th>
                      <th>Doctor</th>
                      <th>Issued Date</th>
                      <th>Prescribed Medicines</th>
                      <th>Dosage</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((rx) => (
                      <tr key={rx.id}>
                        <td><strong>{rx.id}</strong></td>
                        <td>{rx.doctorName}</td>
                        <td>{rx.date}</td>
                        <td>{rx.medicines}</td>
                        <td>{rx.dosage}</td>
                        <td>
                          <button
                            className="action-btn start"
                            onClick={() => alert(`Downloading Prescription ${rx.id}...`)}
                          >
                            📥 Download PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Tab 4: Doctors Directory */}
          {activeTab === "doctors" && (
            <section className="dashboard-section">
              <h3>Available Doctors</h3>
              <div className="appointments-cards-grid">
                <div className="apt-card">
                  <h4>Dr. Ananya Roy</h4>
                  <p className="speciality">Cardiologist (12 yrs exp)</p>
                  <p><strong>Available:</strong> Mon - Fri (09:00 AM - 01:00 PM)</p>
                </div>
                <div className="apt-card">
                  <h4>Dr. Rajesh Gupta</h4>
                  <p className="speciality">General Physician (8 yrs exp)</p>
                  <p><strong>Available:</strong> Daily (10:00 AM - 05:00 PM)</p>
                </div>
                <div className="apt-card">
                  <h4>Dr. Meera Sen</h4>
                  <p className="speciality">Dermatologist (10 yrs exp)</p>
                  <p><strong>Available:</strong> Tue, Thu, Sat (02:00 PM - 06:00 PM)</p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default PatientDashboard;
