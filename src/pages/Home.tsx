import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="home-brand">
          <div className="brand-icon">+</div>
          <span>Doctor CRM</span>
        </div>

        <div className="nav-buttons">
          <Link to="/login" className="login-link">
          </Link>

          <Link to="/signup" className="signup-link">
            Sign Up
          </Link>
        </div>
      </nav>

      <main className="home-content">
        <h1>
          Manage your practice.
          <br />
          <span>Care for your patients.</span>
        </h1>

        <p>
          Doctor CRM helps you manage patients, appointments,
          doctors and your healthcare operations from one place.
        </p>

        <div className="home-actions">
          <Link to="/login" className="home-login-button">
            Login
          </Link>

          <Link to="/signup" className="home-signup-button">
            Create Account
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Home;