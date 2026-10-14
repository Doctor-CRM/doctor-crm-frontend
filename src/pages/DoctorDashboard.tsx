import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { adminService } from "../service/adminService";
import { getApiErrorMessage } from "../service/api";
import "./DoctorDashboard.css";
import logoImg from "../assets/Hospital CRM Healthcare Logo (1).png";
import type { PatientProfile } from "../types/admin";

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

interface PrescriptionRecord {
  id: string;
  patientName: string;
  medicine: string;
  dosage: string;
  notes: string;
  date: string;
}

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"appointments" | "prescription" | "patients">("appointments");
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(";");

  // Dynamic API Patients List
  const [patientsList, setPatientsList] = useState<PatientProfile[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(false);

  // Dynamic Appointments & Prescriptions (starts empty - NO HARDCODED DUMMY DATA)
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptionsList, setPrescriptionsList] = useState<PrescriptionRecord[]>([]);

  // Prescription Form State
  const [prescPatient, setPrescPatient] = useState("");
  const [prescMedicine, setPrescMedicine] = useState("");
  const [prescDosage, setPrescDosage] = useState("");
  const [prescNotes, setPrescNotes] = useState("");
  const [prescSuccessMsg, setPrescSuccessMsg] = useState("");

  const fetchPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    try {
      const data = await adminService.getPatientData();
      setPatientsList(data || []);
    } catch (err) {
      console.warn("Failed to fetch patients:", getApiErrorMessage(err));
    } finally {
      setIsLoadingPatients(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

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

    const newPresc: PrescriptionRecord = {
      id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: prescPatient,
      medicine: prescMedicine,
      dosage: prescDosage || "As directed",
      notes: prescNotes || "Take after meals",
      date: new Date().toLocaleDateString(),
    };

    setPrescriptionsList((prev) => [newPresc, ...prev]);
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
          <img src={logoImg} alt="Hospital CRM Logo" style={{ height: "38px", width: "auto", objectFit: "contain", borderRadius: "6px" }} />
          <div className="brand-badge doctor-badge">👨‍⚕️ Doctor Portal</div>
          <h2>Hospital CRM</h2>
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
              Toggle Status
            </button>
          </div>

          <div className="profile-info">
            <span className="profile-name">{user?.name || user?.username || "Dr. Practitioner"}</span>
            <span className="profile-role">Doctor</span>
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
              📋 Patient Queue ({appointments.length})
            </button>
            <button
              className={`menu-item ${activeTab === "prescription" ? "active" : ""}`}
              onClick={() => setActiveTab("prescription")}
            >
              ✍️ Write Prescription ({prescriptionsList.length})
            </button>
            <button
              className={`menu-item ${activeTab === "patients" ? "active" : ""}`}
              onClick={() => setActiveTab("patients")}
            >
              📁 Patient Directory ({patientsList.length})
            </button>
          </nav>

          <div className="quick-stats-box">
            <h4>Today's OPD Summary</h4>
            <div className="stat-mini">
              <span>Total Queue:</span>
              <strong>{appointments.length}</strong>
            </div>
            <div className="stat-mini">
              <span>Waiting:</span>
              <strong>{appointments.filter((a) => a.status === "Waiting").length}</strong>
            </div>
            <div className="stat-mini">
              <span>Completed:</span>
              <strong>{appointments.filter((a) => a.status === "Completed").length}</strong>
            </div>
          </div>
        </aside>

        {/* Main Workspace Content */}
        <main className="dashboard-main">
          {/* Top Metrics Cards */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">🧑‍🤝‍🧑</div>
              <div className="stat-content">
                <h3>{appointments.length}</h3>
                <p>Total OPD Patients</p>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{appointments.filter((a) => a.status === "Waiting").length}</h3>
                <p>Patients Waiting</p>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{appointments.filter((a) => a.status === "Completed").length}</h3>
                <p>Consultations Done</p>
              </div>
            </div>
          </div>

          {/* Tab 1: OPD Appointments Queue */}
          {activeTab === "appointments" && (
            <section className="dashboard-section">
              <div className="section-header">
                <h3>OPD Patient Queue & Consultations</h3>
                <input
                  type="text"
                  placeholder="Search patient or Token ID..."
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
                      <th>Patient Name</th>
                      <th>Age / Gender</th>
                      <th>Time</th>
                      <th>Reason / Symptoms</th>
                      <th>Checkup Type</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="empty-state">
                          No OPD patients currently in queue.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((apt) => (
                        <tr key={apt.id}>
                          <td><strong>{apt.id}</strong></td>
                          <td>{apt.patientName}</td>
                          <td>{apt.age} Yrs / {apt.gender}</td>
                          <td>{apt.time}</td>
                          <td>{apt.reason}</td>
                          <td>
                            <span className={`pill-tag ${apt.type === "New Checkup" ? "new-checkup" : "follow-up"}`}>
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
                              {apt.status !== "In Consultation" && apt.status !== "Completed" && (
                                <button
                                  className="action-btn start"
                                  onClick={() => handleStatusChange(apt.id, "In Consultation")}
                                >
                                  Call Patient
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
                                Prescribe
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

          {/* Tab 2: Write Digital Prescription */}
          {activeTab === "prescription" && (
            <section className="dashboard-section form-section">
              <h3>Create Digital Prescription</h3>

              {prescSuccessMsg && (
                <div className="alert-banner success-alert">
                  ✅ {prescSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSavePrescription} className="prescription-form">
                <div className="form-group">
                  <label>Select or Enter Patient Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rohan Verma"
                    value={prescPatient}
                    onChange={(e) => setPrescPatient(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Medicine Name & Strength</label>
                    <input
                      type="text"
                      placeholder="e.g. Paracetamol 650mg, Amoxicillin 500mg"
                      value={prescMedicine}
                      onChange={(e) => setPrescMedicine(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Dosage & Frequency</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 Tablet twice daily after meals (5 Days)"
                      value={prescDosage}
                      onChange={(e) => setPrescDosage(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Clinical Notes / Advice</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Drink plenty of water. Rest for 3 days. Follow up next week."
                    value={prescNotes}
                    onChange={(e) => setPrescNotes(e.target.value)}
                  />
                </div>

                <button type="submit" className="submit-presc-btn">
                  Issue Prescription
                </button>
              </form>

              {prescriptionsList.length > 0 && (
                <div style={{ marginTop: "30px" }}>
                  <h4>Issued Prescriptions History ({prescriptionsList.length})</h4>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Rx ID</th>
                          <th>Patient Name</th>
                          <th>Medicines</th>
                          <th>Dosage</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptionsList.map((rx) => (
                          <tr key={rx.id}>
                            <td><strong>{rx.id}</strong></td>
                            <td>{rx.patientName}</td>
                            <td>{rx.medicine}</td>
                            <td>{rx.dosage}</td>
                            <td>{rx.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Tab 3: Patient Directory */}
          {activeTab === "patients" && (
            <section className="dashboard-section">
              <div className="section-header">
                <h3>Registered Patients Directory</h3>
              </div>

              {isLoadingPatients ? (
                <div className="empty-state">Loading Patient records from Database...</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Patient Name</th>
                        <th>Age / Gender</th>
                        <th>Contact Number</th>
                        <th>Blood Group</th>
                        <th>Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="empty-state">
                            No patient records found in Database.
                          </td>
                        </tr>
                      ) : (
                        patientsList.map((p) => (
                          <tr key={p.id}>
                            <td><strong>#PAT-{p.id}</strong></td>
                            <td><strong>{p.patient_name}</strong></td>
                            <td>{p.age} Yrs / {p.gender}</td>
                            <td><code>{p.contact_number}</code></td>
                            <td>
                              <span className="pill-tag role-patient">
                                {p.blood_group}
                              </span>
                            </td>
                            <td>{p.address}</td>
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

export default DoctorDashboard;
