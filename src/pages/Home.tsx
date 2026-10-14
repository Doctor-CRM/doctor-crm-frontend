import { Link, useNavigate } from "react-router-dom";
import "./Home.css";
import { useAuthStore } from "../store/useAuthStore";
import { getRoleDashboardPath, formatRoleName } from "../utils/roleUtils";
import logoImg from "../assets/Hospital CRM Healthcare Logo (1).png";

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
      {/* Top Navigation Bar */}
      <nav className="navbar">
        {/* Brand / Logo */}
        <div className="home-brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <img src={logoImg} alt="Hospital CRM Logo" className="brand-logo-img" />
          <div className="brand-text">
            <span className="brand-name">Hospital CRM</span>
            <span className="brand-tagline">Healthcare Management</span>
          </div>
        </div>


        {/* Action Buttons */}
        <div className="nav-buttons">
          {isAuthenticated ? (
            <>
              <div className="user-pill">
                <span className="user-dot">●</span>
                {user?.name || user?.username || "User"}
                <span className="user-role-badge">{formatRoleName(user?.role)}</span>
              </div>
              <button onClick={() => navigate(userDashboardPath)} className="btn-nav-primary">
                Dashboard 🚀
              </button>
              <button onClick={handleLogout} className="btn-nav-ghost">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-nav-ghost">Login</Link>
              <Link to="/signup" className="btn-nav-primary">Get Started →</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🏥 Trusted Healthcare Management</div>
          <h1 className="hero-title">
            Smart Healthcare,<br />
            <span className="hero-title-accent">Simplified.</span>
          </h1>
          <p className="hero-subtitle">
            A complete CRM platform for hospitals — manage doctors, patients,
            appointments, and staff all in one place. Built for modern healthcare.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to={userDashboardPath} className="btn-primary">
                Go to Dashboard 🚀
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn-primary">
                  Get Started — It's Free
                </Link>
                <Link to="/login" className="btn-outline">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👨‍⚕️</div>
            <h3>Doctor Management</h3>
            <p>Manage doctor profiles, schedules, and specializations effortlessly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🗓️</div>
            <h3>Appointments</h3>
            <p>Book, track, and manage patient appointments in real time.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧾</div>
            <h3>Patient Records</h3>
            <p>Centralized patient data — history, prescriptions, and reports.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏨</div>
            <h3>Reception Desk</h3>
            <p>Streamline front desk operations and patient check-ins instantly.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <p>© 2026 Hospital CRM — Built for better healthcare management.</p>
      </footer>
    </div>
  );
}

export default Home;