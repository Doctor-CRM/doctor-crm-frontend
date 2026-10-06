import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import "./AdminDashboard.css";
import type { UserRole } from "../types/auth";

interface SystemUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  status: "Active" | "Inactive";
  joinedDate: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"users" | "addUser" | "settings" | "logs">("users");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // New User Form State
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("doctor");
  const [userCreatedMsg, setUserCreatedMsg] = useState("");

  const [usersList, setUsersList] = useState<SystemUser[]>([
    { id: "USR-001", name: "Dr. Ananya Roy", email: "ananya@hospital.com", username: "dr_ananya", role: "doctor", status: "Active", joinedDate: "12 Jan 2025" },
    { id: "USR-002", name: "Dr. Rajesh Gupta", email: "rajesh@hospital.com", username: "dr_rajesh", role: "doctor", status: "Active", joinedDate: "05 Feb 2025" },
    { id: "USR-003", name: "Ramesh Sharma", email: "reception1@hospital.com", username: "rec_ramesh", role: "receptionist", status: "Active", joinedDate: "20 Mar 2025" },
    { id: "USR-004", name: "Rahul Sharma", email: "rahul@gmail.com", username: "rahul34", role: "patient", status: "Active", joinedDate: "01 Sep 2026" },
    { id: "USR-005", name: "Super Admin", email: "admin@hospital.com", username: "admin", role: "admin", status: "Active", joinedDate: "01 Jan 2025" },
  ]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleToggleUserStatus = (id: string) => {
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u
      )
    );
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const created: SystemUser = {
      id: `USR-00${usersList.length + 1}`,
      name: newUserName,
      email: newUserEmail,
      username: newUserName.toLowerCase().replace(/\s+/g, "_"),
      role: newUserRole,
      status: "Active",
      joinedDate: "Today",
    };

    setUsersList([...usersList, created]);
    setUserCreatedMsg(`User "${newUserName}" created successfully as ${newUserRole.toUpperCase()}!`);

    setTimeout(() => {
      setUserCreatedMsg("");
      setNewUserName("");
      setNewUserEmail("");
      setNewUserRole("doctor");
      setActiveTab("users");
    }, 2000);
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesQuery =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesQuery;
  });

  return (
    <div className="dashboard-layout admin-theme">
      {/* Top Navbar */}
      <header className="dashboard-header">
        <div className="brand-section">
          <div className="brand-badge admin-badge">⚙️ Admin Console</div>
          <h2>Doctor CRM</h2>
        </div>

        <div className="user-profile-section">
          <div className="system-health-badge">
            ⚡ System Health: <strong style={{ color: "#16a34a" }}>100% Operational</strong>
          </div>

          <div className="profile-info">
            <span className="profile-name">
              {user?.name || user?.username || "Admin"}
            </span>
            <span className="profile-role">System Administrator</span>
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
              className={`menu-item ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              👥 System Users List
            </button>
            <button
              className={`menu-item ${activeTab === "addUser" ? "active" : ""}`}
              onClick={() => setActiveTab("addUser")}
            >
              ➕ Register New Staff / User
            </button>
            <button
              className={`menu-item ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              ⚙️ Clinic System Settings
            </button>
            <button
              className={`menu-item ${activeTab === "logs" ? "active" : ""}`}
              onClick={() => setActiveTab("logs")}
            >
              📜 Security & Audit Logs
            </button>
          </nav>

          <div className="quick-stats-box">
            <h4>System Overview</h4>
            <div className="stat-mini">
              <span>Database:</span>
              <strong>Connected</strong>
            </div>
            <div className="stat-mini">
              <span>Version:</span>
              <strong>v2.4.0-Pro</strong>
            </div>
          </div>
        </aside>

        {/* Main Workspace Content */}
        <main className="dashboard-main">
          {/* Top Metrics Cards */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-content">
                <h3>{usersList.filter((u) => u.role === "doctor").length}</h3>
                <p>Total Doctors</p>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">🧑‍🤝‍🧑</div>
              <div className="stat-content">
                <h3>{usersList.filter((u) => u.role === "patient").length}</h3>
                <p>Total Patients</p>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <h3>{usersList.filter((u) => u.role === "receptionist").length}</h3>
                <p>Reception Staff</p>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">🛡️</div>
              <div className="stat-content">
                <h3>{usersList.filter((u) => u.role === "admin").length}</h3>
                <p>Administrators</p>
              </div>
            </div>
          </div>

          {/* Tab 1: System Users */}
          {activeTab === "users" && (
            <section className="dashboard-section">
              <div className="section-header">
                <h3>System Users Management</h3>

                <div className="filter-controls">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="table-search-input"
                    style={{ width: "160px" }}
                  >
                    <option value="all">All Roles</option>
                    <option value="doctor">Doctors</option>
                    <option value="patient">Patients</option>
                    <option value="receptionist">Receptionists</option>
                    <option value="admin">Admins</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Search user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="table-search-input"
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Assigned Role</th>
                      <th>Status</th>
                      <th>Joined Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td><strong>{u.id}</strong></td>
                        <td>{u.name}</td>
                        <td><code>{u.username}</code></td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`pill-tag role-${u.role}`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={u.status === "Active" ? "status-online" : "status-offline"}>
                            {u.status}
                          </span>
                        </td>
                        <td>{u.joinedDate}</td>
                        <td>
                          <button
                            className={`action-btn ${u.status === "Active" ? "complete" : "start"}`}
                            onClick={() => handleToggleUserStatus(u.id)}
                          >
                            {u.status === "Active" ? "Disable" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Tab 2: Register New Staff */}
          {activeTab === "addUser" && (
            <section className="dashboard-section form-section">
              <h3>Create & Assign System User</h3>

              {userCreatedMsg && (
                <div className="alert-banner success-alert">
                  ✅ {userCreatedMsg}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="prescription-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Sunita Rao"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="sunita@hospital.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Assign Role Enum</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      required
                    >
                      <option value="doctor">Doctor</option>
                      <option value="patient">Patient</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="submit-presc-btn">
                  Register User
                </button>
              </form>
            </section>
          )}

          {/* Tab 3: Settings */}
          {activeTab === "settings" && (
            <section className="dashboard-section form-section">
              <h3>Clinic Operational Settings</h3>
              <div className="form-group">
                <label>Clinic Name</label>
                <input type="text" defaultValue="Doctor CRM Multispecialty Clinic" />
              </div>
              <div className="form-group">
                <label>OPD Consultation Fee (₹)</label>
                <input type="number" defaultValue="500" />
              </div>
              <button className="submit-presc-btn" onClick={() => alert("Settings updated!")}>
                Save Settings
              </button>
            </section>
          )}

          {/* Tab 4: Logs */}
          {activeTab === "logs" && (
            <section className="dashboard-section">
              <h3>System Security Logs</h3>
              <p>• User <strong>dr_ananya</strong> logged in at 09:14 AM</p>
              <p>• User <strong>rec_ramesh</strong> issued Token APT-101 at 09:20 AM</p>
              <p>• Backup sync completed at 02:00 AM</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
