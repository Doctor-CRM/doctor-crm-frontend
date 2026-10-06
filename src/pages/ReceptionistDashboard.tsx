import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import "./ReceptionistDashboard.css";

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
  const [activeTab, setActiveTab] = useState<"tokens" | "newWalkIn" | "doctors">("tokens");

  // New Walk-in Registration State
  const [walkInName, setWalkInName] = useState("");
  const [walkInAge, setWalkInAge] = useState("");
  const [walkInGender, setWalkInGender] = useState("Male");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [priority, setPriority] = useState<"Normal" | "Urgent">("Normal");
  const [tokenCreatedMsg, setTokenCreatedMsg] = useState("");

  const [tokensList, setTokensList] = useState<OPDToken[]>([
    {
      tokenNumber: "TK-01",
      patientName: "Rahul Sharma",
      age: 34,
      gender: "Male",
      doctorAssigned: "Dr. Rajesh Gupta",
      status: "Checked In",
      priority: "Normal",
      timeIssued: "09:15 AM",
    },
    {
      tokenNumber: "TK-02",
      patientName: "Priya Patel",
      age: 28,
      gender: "Female",
      doctorAssigned: "Dr. Ananya Roy",
      status: "In OPD",
      priority: "Urgent",
      timeIssued: "09:30 AM",
    },
    {
      tokenNumber: "TK-03",
      patientName: "Amit Kumar",
      age: 52,
      gender: "Male",
      doctorAssigned: "Dr. Rajesh Gupta",
      status: "Checked In",
      priority: "Normal",
      timeIssued: "10:00 AM",
    },
  ]);

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
          <div className="brand-badge reception-badge">💁‍♀️ Reception Desk</div>
          <h2>Doctor CRM</h2>
        </div>

        <div className="user-profile-section">
          <div className="opd-counter-badge">
            🖥️ Counter: <strong>Desk 01 (Main Lobby)</strong>
          </div>

          <div className="profile-info">
            <span className="profile-name">
              {user?.name || user?.username || "Receptionist"}
            </span>
            <span className="profile-role">Front Desk Executive</span>
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
              🎟️ Live OPD Queue
            </button>
            <button
              className={`menu-item ${activeTab === "newWalkIn" ? "active" : ""}`}
              onClick={() => setActiveTab("newWalkIn")}
            >
              ➕ New Walk-in Check-in
            </button>
            <button
              className={`menu-item ${activeTab === "doctors" ? "active" : ""}`}
              onClick={() => setActiveTab("doctors")}
            >
              👨‍⚕️ Doctor Duty Roster
            </button>
          </nav>

          <div className="quick-stats-box">
            <h4>OPD Status</h4>
            <div className="stat-mini">
              <span>Next Available:</span>
              <strong>Dr. Rajesh Gupta</strong>
            </div>
            <div className="stat-mini">
              <span>Avg Wait Time:</span>
              <strong>12 mins</strong>
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
                <p>Tokens Issued Today</p>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{tokensList.filter((t) => t.status === "Checked In").length}</h3>
                <p>Patients Waiting</p>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">🩺</div>
              <div className="stat-content">
                <h3>{tokensList.filter((t) => t.status === "In OPD").length}</h3>
                <p>Currently in OPD Room</p>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">🚨</div>
              <div className="stat-content">
                <h3>{tokensList.filter((t) => t.priority === "Urgent").length}</h3>
                <p>Urgent Cases</p>
              </div>
            </div>
          </div>

          {/* Tab 1: Live OPD Queue */}
          {activeTab === "tokens" && (
            <section className="dashboard-section">
              <div className="section-header">
                <h3>Front Desk OPD Token Queue</h3>
                <button
                  className="submit-presc-btn"
                  onClick={() => setActiveTab("newWalkIn")}
                >
                  + Issue New OPD Token
                </button>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Token No</th>
                      <th>Issued Time</th>
                      <th>Patient Name</th>
                      <th>Age / Gender</th>
                      <th>Doctor Assigned</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokensList.map((token) => (
                      <tr key={token.tokenNumber}>
                        <td><strong>{token.tokenNumber}</strong></td>
                        <td>{token.timeIssued}</td>
                        <td>{token.patientName}</td>
                        <td>{token.age} yrs / {token.gender}</td>
                        <td>{token.doctorAssigned}</td>
                        <td>
                          <span
                            className={`pill-tag ${
                              token.priority === "Urgent" ? "follow-up" : "new-checkup"
                            }`}
                          >
                            {token.priority}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-tag ${token.status.toLowerCase().replace(" ", "-")}`}
                          >
                            {token.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            {token.status === "Checked In" && (
                              <button
                                className="action-btn start"
                                onClick={() => handleStatusChange(token.tokenNumber, "In OPD")}
                              >
                                Send to OPD
                              </button>
                            )}
                            {token.status === "In OPD" && (
                              <button
                                className="action-btn complete"
                                onClick={() => handleStatusChange(token.tokenNumber, "Completed")}
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Tab 2: Issue Walk-in Token */}
          {activeTab === "newWalkIn" && (
            <section className="dashboard-section form-section">
              <h3>Walk-in Patient OPD Registration</h3>

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
                    placeholder="Enter patient name..."
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
                      <option value="" disabled>Select Doctor...</option>
                      <option value="Dr. Rajesh Gupta">Dr. Rajesh Gupta (General Medicine)</option>
                      <option value="Dr. Ananya Roy">Dr. Ananya Roy (Cardiology)</option>
                      <option value="Dr. Meera Sen">Dr. Meera Sen (Dermatology)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority Level</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as "Normal" | "Urgent")}
                    >
                      <option value="Normal">Normal Walk-in</option>
                      <option value="Urgent">🚨 Emergency / Urgent</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="submit-presc-btn">
                  🎟️ Print & Issue OPD Token
                </button>
              </form>
            </section>
          )}

          {/* Tab 3: Doctor Duty Roster */}
          {activeTab === "doctors" && (
            <section className="dashboard-section">
              <h3>Doctor Availability & Room Roster</h3>
              <div className="appointments-cards-grid">
                <div className="apt-card">
                  <h4>Dr. Rajesh Gupta</h4>
                  <p className="speciality">Room 104 - General OPD</p>
                  <p className="status-online">🟢 Available (3 Patients in Queue)</p>
                </div>

                <div className="apt-card">
                  <h4>Dr. Ananya Roy</h4>
                  <p className="speciality">Room 201 - Cardiology</p>
                  <p className="status-online">🟢 Available (1 Patient in OPD)</p>
                </div>

                <div className="apt-card">
                  <h4>Dr. Meera Sen</h4>
                  <p className="speciality">Room 108 - Dermatology</p>
                  <p className="status-offline">🔴 In Surgery / Break</p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
