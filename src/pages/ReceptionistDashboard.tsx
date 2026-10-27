import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { adminService } from "../service/adminService";
import { getApiErrorMessage } from "../service/api";
import { getEffectiveUsername } from "../utils/roleUtils";
import "./ReceptionistDashboard.css";
import logoImg from "../assets/Hospital CRM Healthcare Logo (1).png";
import type { DoctorProfile } from "../types/admin";

interface OPDToken {
  tokenNumber: string;
  patientName: string;
  age: number;
  gender: string;
  doctorAssigned: string;
  status: "Checked In" | "In OPD" | "Completed";
  priority: "Normal" | "Urgent";
  timeIssued: string;
}

export const ReceptionistDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const effectiveUsername = getEffectiveUsername(user);
  const [activeTab, setActiveTab] = useState<"tokens" | "newWalkIn" | "doctors">("tokens");

  // Dynamic API Doctors List
  const [doctorsList, setDoctorsList] = useState<DoctorProfile[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState<boolean>(false);

  // Dynamic OPD Tokens List (NO HARDCODED DUMMY DATA)
  const [tokensList, setTokensList] = useState<OPDToken[]>([]);

  // New Walk-in Registration State
  const [walkInName, setWalkInName] = useState("");
  const [walkInAge, setWalkInAge] = useState("");
  const [walkInGender, setWalkInGender] = useState("Male");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [priority, setPriority] = useState<"Normal" | "Urgent">("Normal");
  const [tokenCreatedMsg, setTokenCreatedMsg] = useState("");

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

  const handleStatusChange = (tokenNumber: string, newStatus: OPDToken["status"]) => {
    setTokensList((prev) =>
      prev.map((t) => (t.tokenNumber === tokenNumber ? { ...t, status: newStatus } : t))
    );
  };

  const handleIssueToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName || !walkInAge || !selectedDoctor) return;

    const nextNumber = tokensList.length + 1;
    const newToken: OPDToken = {
      tokenNumber: `TK-${nextNumber < 10 ? "0" + nextNumber : nextNumber}`,
      patientName: walkInName,
      age: parseInt(walkInAge) || 25,
      gender: walkInGender,
      doctorAssigned: selectedDoctor,
      status: "Checked In",
      priority: priority,
      timeIssued: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setTokensList([...tokensList, newToken]);
    setTokenCreatedMsg(`Token ${newToken.tokenNumber} issued to ${walkInName}!`);

    setTimeout(() => {
      setTokenCreatedMsg("");
      setWalkInName("");
      setWalkInAge("");
      setSelectedDoctor("");
      setPriority("Normal");
      setActiveTab("tokens");
    }, 2000);
  };

  return (
    <div className="dashboard-layout receptionist-theme">
      {/* Top Navbar */}
      <header className="dashboard-header">
        <div className="brand-section">
          <img src={logoImg} alt="Hospital CRM Logo" style={{ height: "38px", width: "auto", objectFit: "contain", borderRadius: "6px" }} />
          <div className="brand-badge reception-badge">💁‍♀️ Reception Desk</div>
          <h2>Hospital CRM</h2>
        </div>

        <div className="user-profile-section">
          <div className="opd-counter-badge">
            🖥️ Counter: <strong>Desk 01 (Main Lobby)</strong>
          </div>

          <div className="logged-in-profile-badge">
            <div className="profile-badge-avatar reception">
              {effectiveUsername ? effectiveUsername.charAt(0).toUpperCase() : "R"}
            </div>
            <div className="profile-badge-text">
              <span className="profile-badge-label">Logged In</span>
              <span className="profile-badge-username">@{effectiveUsername || "reception"}</span>
            </div>
            <span className="profile-badge-role reception">Receptionist</span>
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
              className={`menu-item ${activeTab === "tokens" ? "active" : ""}`}
              onClick={() => setActiveTab("tokens")}
            >
              🎫 Active OPD Tokens ({tokensList.length})
            </button>
            <button
              className={`menu-item ${activeTab === "newWalkIn" ? "active" : ""}`}
              onClick={() => setActiveTab("newWalkIn")}
            >
              ➕ Issue Walk-in Token
            </button>
            <button
              className={`menu-item ${activeTab === "doctors" ? "active" : ""}`}
              onClick={() => setActiveTab("doctors")}
            >
              👨‍⚕️ Doctor Duty Status ({doctorsList.length})
            </button>
          </nav>

          <div className="quick-stats-box">
            <h4>OPD Desk Overview</h4>
            <div className="stat-mini">
              <span>Tokens Issued:</span>
              <strong>{tokensList.length}</strong>
            </div>
            <div className="stat-mini">
              <span>In Queue:</span>
              <strong>{tokensList.filter((t) => t.status === "Checked In").length}</strong>
            </div>
            <div className="stat-mini">
              <span>Urgent Cases:</span>
              <strong>{tokensList.filter((t) => t.priority === "Urgent").length}</strong>
            </div>
          </div>

          <div className="sidebar-user-footer">
            <div className="sidebar-user-avatar reception">
              {effectiveUsername ? effectiveUsername.charAt(0).toUpperCase() : "R"}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-label">Logged In Receptionist</span>
              <span className="sidebar-user-username">@{effectiveUsername || "reception"}</span>
            </div>
          </div>
        </aside>

        {/* Main Workspace Content */}
        <main className="dashboard-main">
          {/* Top Metrics Cards */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">🎫</div>
              <div className="stat-content">
                <h3>{tokensList.length}</h3>
                <p>Today's OPD Tokens</p>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">⌛</div>
              <div className="stat-content">
                <h3>{tokensList.filter((t) => t.status === "Checked In").length}</h3>
                <p>Waiting in Lobby</p>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-content">
                <h3>{doctorsList.length}</h3>
                <p>Available Doctors</p>
              </div>
            </div>
          </div>

          {/* Tab 1: OPD Tokens Queue */}
          {activeTab === "tokens" && (
            <section className="dashboard-section">
              <div className="section-header">
                <div>
                  <h3>Live OPD Queue Management</h3>
                  <div className="tab-account-badge">
                    💁‍♀️ Desk Operator: <strong>@{effectiveUsername || "reception"}</strong>
                  </div>
                </div>
                <button
                  className="submit-presc-btn"
                  onClick={() => setActiveTab("newWalkIn")}
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  + Issue New Token
                </button>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Token No.</th>
                      <th>Patient Name</th>
                      <th>Age / Gender</th>
                      <th>Assigned Doctor</th>
                      <th>Time Issued</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokensList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="empty-state">
                          No OPD tokens issued yet for today.
                        </td>
                      </tr>
                    ) : (
                      tokensList.map((t) => (
                        <tr key={t.tokenNumber}>
                          <td><strong>{t.tokenNumber}</strong></td>
                          <td>{t.patientName}</td>
                          <td>{t.age} Yrs / {t.gender}</td>
                          <td>{t.doctorAssigned}</td>
                          <td>{t.timeIssued}</td>
                          <td>
                            <span className={`pill-tag ${t.priority === "Urgent" ? "follow-up" : "new-checkup"}`}>
                              {t.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`status-tag ${t.status.toLowerCase().replace(" ", "-")}`}>
                              {t.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons-group">
                              {t.status === "Checked In" && (
                                <button
                                  className="action-btn start"
                                  onClick={() => handleStatusChange(t.tokenNumber, "In OPD")}
                                >
                                  Send to OPD
                                </button>
                              )}
                              {t.status === "In OPD" && (
                                <button
                                  className="action-btn complete"
                                  onClick={() => handleStatusChange(t.tokenNumber, "Completed")}
                                >
                                  Complete
                                </button>
                              )}
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

          {/* Tab 2: Issue Walk-in Token */}
          {activeTab === "newWalkIn" && (
            <section className="dashboard-section form-section">
              <div>
                <h3>Register Walk-in OPD Patient</h3>
                <div className="tab-account-badge">
                  🎫 Token Issued By: <strong>@{effectiveUsername || "reception"}</strong>
                </div>
              </div>

              {tokenCreatedMsg && (
                <div className="alert-banner success-alert">
                  ✅ {tokenCreatedMsg}
                </div>
              )}

              <form onSubmit={handleIssueToken} className="prescription-form">
                <div className="form-group">
                  <label>Patient Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      placeholder="e.g. 35"
                      value={walkInAge}
                      onChange={(e) => setWalkInAge(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      value={walkInGender}
                      onChange={(e) => setWalkInGender(e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Assign Doctor</label>
                    <select
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select Doctor from Database</option>
                      {doctorsList.length === 0 ? (
                        <option value="Dr. On Duty">General OPD Doctor</option>
                      ) : (
                        doctorsList.map((doc) => (
                          <option key={doc.id} value={doc.doctor_name}>
                            {doc.doctor_name} ({doc.doctor_type})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as "Normal" | "Urgent")}
                    >
                      <option value="Normal">Normal Queue</option>
                      <option value="Urgent">Urgent / Emergency</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="submit-presc-btn">
                  Issue OPD Token
                </button>
              </form>
            </section>
          )}

          {/* Tab 3: Doctor Duty Roster */}
          {activeTab === "doctors" && (
            <section className="dashboard-section">
              <div className="section-header">
                <div>
                  <h3>Doctor Duty Status</h3>
                  <div className="tab-account-badge">
                    👨‍⚕️ Desk Operator: <strong>@{effectiveUsername || "reception"}</strong>
                  </div>
                </div>
              </div>

              {isLoadingDoctors ? (
                <div className="empty-state">Loading Doctor Duty Status from Database...</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Doc ID</th>
                        <th>Doctor Name</th>
                        <th>Speciality</th>
                        <th>Fee</th>
                        <th>Abilities</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctorsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="empty-state">
                            No doctors found in Database.
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
                            <td>₹{doc.consultation_fee}</td>
                            <td>{doc.doctor_abilities}</td>
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
                                  setActiveTab("newWalkIn");
                                }}
                              >
                                Assign Token
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

export default ReceptionistDashboard;
