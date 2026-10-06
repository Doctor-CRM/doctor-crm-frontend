import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import "./DoctorDashboard.css";

interface Appointment {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  time: string;
  reason: string;
  status: "Waiting" | "In Consultation" | "Completed";
  type: "Follow-up" | "New Checkup" | "Emergency";
}

interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  lastVisit: string;
  condition: string;
}

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"appointments" | "prescription" | "patients">("appointments");
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Prescription Form State
  const [prescPatient, setPrescPatient] = useState("");
  const [prescMedicine, setPrescMedicine] = useState("");
  const [prescDosage, setPrescDosage] = useState("");
  const [prescNotes, setPrescNotes] = useState("");
  const [prescSuccessMsg, setPrescSuccessMsg] = useState("");

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "APT-101",
      patientName: "Rahul Sharma",
      age: 34,
      gender: "Male",
      time: "09:30 AM",
      reason: "Severe Headache & Fever",
      status: "Waiting",
      type: "New Checkup",
    },
    {
      id: "APT-102",
      patientName: "Priya Patel",
      age: 28,
      gender: "Female",
      time: "10:15 AM",
      reason: "Skin Allergy Follow-up",
      status: "In Consultation",
      type: "Follow-up",
    },
    {
      id: "APT-103",
      patientName: "Amit Kumar",
      age: 52,
      gender: "Male",
      time: "11:00 AM",
      reason: "Blood Pressure Routine Check",
      status: "Waiting",
      type: "Follow-up",
    },
    {
      id: "APT-104",
      patientName: "Sunita Verma",
      age: 41,
      gender: "Female",
      time: "11:45 AM",
      reason: "Acute Joint Pain",
      status: "Completed",
      type: "New Checkup",
    },
  ]);

  const [patients] = useState<Patient[]>([
    { id: "P-001", name: "Rahul Sharma", age: 34, phone: "+91 9876543210", lastVisit: "Today", condition: "Migraine" },
    { id: "P-002", name: "Priya Patel", age: 28, phone: "+91 9876543211", lastVisit: "Today", condition: "Dermatitis" },
    { id: "P-003", name: "Amit Kumar", age: 52, phone: "+91 9876543212", lastVisit: "25 Sep 2026", condition: "Hypertension" },
    { id: "P-004", name: "Sunita Verma", age: 41, phone: "+91 9876543213", lastVisit: "Today", condition: "Arthritis" },
  ]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleStatusChange = (id: string, newStatus: Appointment["status"]) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );
  };

  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescPatient || !prescMedicine) return;
    setPrescSuccessMsg(`Prescription created successfully for ${prescPatient}!`);
    setTimeout(() => {
      setPrescSuccessMsg("");
      setPrescPatient("");
      setPrescMedicine("");
      setPrescDosage("");
      setPrescNotes("");
      setActiveTab("appointments");
    }, 2000);
  };

  const filteredAppointments = appointments.filter((apt) =>
    apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-layout doctor-theme">
      {/* Top Navbar */}
      <header className="dashboard-header">
        <div className="brand-section">
          <div className="brand-badge doctor-badge">👨‍⚕️ Doctor Portal</div>
          <h2>Doctor CRM</h2>
        </div>

        <div className="user-profile-section">
          <div className="doctor-status-toggle">
            <span className={isAvailable ? "status-online" : "status-offline"}>
              {isAvailable ? "🟢 On Duty" : "🔴 Busy"}
            </span>
            <button
              onClick={() => setIsAvailable(!isAvailable)}
              className="toggle-btn"
            >
              {isAvailable ? "Set Busy" : "Set Available"}
            </button>
          </div>

          <div className="profile-info">
            <span className="profile-name">
              Dr. {user?.name || user?.username || "Doctor"}
            </span>
            <span className="profile-role">Medical Practitioner</span>
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
              📋 Appointments Queue
            </button>
            <button
              className={`menu-item ${activeTab === "prescription" ? "active" : ""}`}
              onClick={() => setActiveTab("prescription")}
            >
              ✏️ Write Prescription
            </button>
            <button
              className={`menu-item ${activeTab === "patients" ? "active" : ""}`}
              onClick={() => setActiveTab("patients")}
            >
              👥 Patient Directory
            </button>
          </nav>

          <div className="quick-stats-box">
            <h4>Quick Info</h4>
            <div className="stat-mini">
              <span>Opd Counter:</span>
              <strong>Room 104</strong>
            </div>
            <div className="stat-mini">
              <span>Shift:</span>
              <strong>Morning (09 AM - 02 PM)</strong>
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
                <p>Today's Appointments</p>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{appointments.filter((a) => a.status === "Waiting").length}</h3>
                <p>Waiting Patients</p>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{appointments.filter((a) => a.status === "Completed").length}</h3>
                <p>Consultations Completed</p>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">💊</div>
              <div className="stat-content">
                <h3>12</h3>
                <p>Prescriptions Issued</p>
              </div>
            </div>
          </div>

          {/* Tab 1: Appointments Queue */}
          {activeTab === "appointments" && (
            <section className="dashboard-section">
              <div className="section-header">
                <h3>Today's Patient Queue</h3>
                <input
                  type="text"
                  placeholder="Search by patient name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="table-search-input"
                />
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Token / ID</th>
                      <th>Time</th>
                      <th>Patient Name</th>
                      <th>Age / Gender</th>
                      <th>Reason for Visit</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="empty-state">
                          No matching appointments found.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((apt) => (
                        <tr key={apt.id}>
                          <td><strong>{apt.id}</strong></td>
                          <td>{apt.time}</td>
                          <td>{apt.patientName}</td>
                          <td>{apt.age} yrs / {apt.gender}</td>
                          <td>{apt.reason}</td>
                          <td>
                            <span className={`pill-tag ${apt.type.toLowerCase().replace(" ", "-")}`}>
                              {apt.type}
                            </span>
                          </td>
                          <td>
                            <span className={`status-tag ${apt.status.toLowerCase().replace(" ", "-")}`}>
                              {apt.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons-group">
                              {apt.status === "Waiting" && (
                                <button
                                  className="action-btn start"
                                  onClick={() => handleStatusChange(apt.id, "In Consultation")}
                                >
                                  Start
                                </button>
                              )}
                              {apt.status === "In Consultation" && (
                                <button
                                  className="action-btn complete"
                                  onClick={() => handleStatusChange(apt.id, "Completed")}
                                >
                                  Complete
                                </button>
                              )}
                              <button
                                className="action-btn presc"
                                onClick={() => {
                                  setPrescPatient(apt.patientName);
                                  setActiveTab("prescription");
                                }}
                              >
                                Rx
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Tab 2: Write Prescription */}
          {activeTab === "prescription" && (
            <section className="dashboard-section form-section">
              <h3>Create Digital Prescription</h3>

              {prescSuccessMsg && (
                <div className="alert-banner success-alert">
                  ✅ {prescSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSavePrescription} className="prescription-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Select Patient</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={prescPatient}
                      onChange={(e) => setPrescPatient(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Medicine Name & Composition</label>
                    <input
                      type="text"
                      placeholder="e.g. Paracetamol 650mg / Amoxicillin 500mg"
                      value={prescMedicine}
                      onChange={(e) => setPrescMedicine(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Dosage & Frequency</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 Tablet after meals (1-0-1 for 5 days)"
                      value={prescDosage}
                      onChange={(e) => setPrescDosage(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Clinical Advice / Special Instructions</label>
                  <textarea
                    rows={4}
                    placeholder="Drink plenty of warm water, rest for 3 days, avoid cold drinks..."
                    value={prescNotes}
                    onChange={(e) => setPrescNotes(e.target.value)}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-presc-btn">
                    💾 Generate & Save Prescription
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Tab 3: Patient Directory */}
          {activeTab === "patients" && (
            <section className="dashboard-section">
              <h3>Registered Patients Directory</h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient ID</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Contact Phone</th>
                      <th>Last Visit</th>
                      <th>Primary Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.id}</strong></td>
                        <td>{p.name}</td>
                        <td>{p.age}</td>
                        <td>{p.phone}</td>
                        <td>{p.lastVisit}</td>
                        <td><span className="condition-tag">{p.condition}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;
