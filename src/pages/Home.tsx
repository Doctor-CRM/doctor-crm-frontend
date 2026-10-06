import { Link, useNavigate } from "react-router-dom";
import "./Home.css";
import { useAuthStore } from "../store/useAuthStore";
import { getRoleDashboardPath, formatRoleName } from "../utils/roleUtils";

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userDashboardPath = getRoleDashboardPath(user?.role);

  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="home-brand">
          <div className="brand-icon">+</div>
          <span>Doctor CRM</span>
        </div>

        <div className="nav-buttons">
          {isAuthenticated ? (
            <>
              <span className="user-welcome">
                Welcome, {user?.name || user?.username || "User"} ({formatRoleName(user?.role)})
              </span>
              <button
                onClick={() => navigate(userDashboardPath)}
                className="signup-link"
              >
                Go to Dashboard
              </button>
              <button onClick={handleLogout} className="login-link logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-link">
                Login
              </Link>
              <Link to="/signup" className="signup-link">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="home-content">
        <h1>
          Manage your practice.
          <br />
          <span>Care for your patients.</span>
        </h1>

        <p>
          Doctor CRM features 4 specialized portals based on user role:
          Patient, Doctor, Admin, and Receptionist.
        </p>

        <div className="home-actions">
          {isAuthenticated ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "center" }}>
              <div className="auth-status-badge">
                ✓ Logged in as <strong>{formatRoleName(user?.role)}</strong>
              </div>
              <Link to={userDashboardPath} className="home-login-button">
                Open {formatRoleName(user?.role)} Dashboard
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="home-login-button">
                Login to Portal
              </Link>
              <Link to="/signup" className="home-signup-button">
                Create Account
              </Link>
            </>
          )}
        </div>

        {/* 4 Role Enum Cards Section */}
        <div style={{ marginTop: "60px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px", textAlign: "left" }}>
          <div style={{ background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#0369a1" }}>👨‍⚕️ Doctor</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Manage appointments queue, write digital prescriptions & view patient history.</p>
          </div>

          <div style={{ background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#15803d" }}>🏥 Patient</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Book appointments, view digital prescriptions & access medical health card.</p>
          </div>

          <div style={{ background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#b45309" }}>⚙️ Admin</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Manage system users, assign roles, configure clinic settings & view security logs.</p>
          </div>

          <div style={{ background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#6b21a8" }}>💁‍♀️ Receptionist</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Register walk-in OPD patients, issue live tokens & manage front desk queue.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;